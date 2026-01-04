import pool from '../config/db.js';

//get all products

export const getAllProducts = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, c.category_name 
       FROM products p
       LEFT JOIN category c ON p.category_id = c.category_id
       WHERE p.is_active = true
       ORDER BY p.product_name`
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getProductVariants = async (req, res) => {
  try {
    const { productId } = req.params;
    const result = await pool.query(
      `SELECT * FROM product_variants 
       WHERE product_id = $1 
       ORDER BY is_default DESC, variant_id`,
      [productId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching product variants:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

//get single product by ID
export const getProductById = async (req, res) => {
    try {
        const { productId } = req.params;
        const product = await pool.query('SELECT * FROM products WHERE product_id = $1', [productId]);
        
        if (product.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        res.json(product.rows[0]);
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

//create product
export const createProduct = async (req, res) => {
    try {
        const { product_name, category_id, is_active = true } = req.body;
        
        // Input validation
        if (!product_name || !category_id) {
            return res.status(400).json({ error: 'Product name and category ID are required' });
        }
        
        const newProduct = await pool.query(
            'INSERT INTO products (product_name, category_id, is_active) VALUES ($1, $2, $3) RETURNING *',
            [product_name, category_id, is_active]
        );
        res.status(201).json(newProduct.rows[0]);
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ error: 'Internal server error' });

        
    }
};

//update product
export const updateProduct = async (req, res) => {
    try{
        const { productId } = req.params;
        const { product_name, category_id, is_active } = req.body;
        
        // Input validation
        if (!product_name || !category_id) {
            return res.status(400).json({ error: 'Product name and category ID are required' });
        }
        
        const updatedProduct = await pool.query(
            'UPDATE products SET product_name = $1, category_id = $2, is_active = COALESCE($3, is_active) WHERE product_id = $4 RETURNING *',
            [product_name, category_id, is_active, productId]
        );
        if (updatedProduct.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json(updatedProduct.rows[0]);
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ error: 'Internal server error' });
        
    }

}

//delete product
export const deleteProduct = async (req, res) => {
    try {
        const { productId } = req.params;
        
        // Check if product exists first
        const productExists = await pool.query('SELECT * FROM products WHERE product_id = $1', [productId]);
        if (productExists.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        const deletedProduct = await pool.query(
            'DELETE FROM products WHERE product_id = $1 RETURNING *',
            [productId]
        );
        res.json({ message: 'Product deleted successfully', product: deletedProduct.rows[0] });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ error: 'Internal server error' });

    }
};



// Get all products with their variants
export const getProductsWithVariants = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                p.*, 
                c.category_name,
                json_agg(
                    json_build_object(
                        'variant_id', pv.variant_id,
                        'size_label', pv.size_label,
                        'price', pv.price,
                        'is_default', pv.is_default
                    )
                    ORDER BY pv.is_default DESC, pv.variant_id
                ) as variants
            FROM products p
            LEFT JOIN category c ON p.category_id = c.category_id
            LEFT JOIN product_variants pv ON p.product_id = pv.product_id
            GROUP BY p.product_id, c.category_name
            ORDER BY p.product_name
        `);
        
        // Transform the result to handle products without variants
        const products = result.rows.map(row => ({
            ...row,
            variants: row.variants[0] ? row.variants : []
        }));
        
        res.json(products);
    } catch (error) {
        console.error('Error fetching products with variants:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Create product with variants
export const createProductWithVariants = async (req, res) => {
    const client = await pool.connect();
    
    try {
        const { product_name, category_id, is_active = true, variants } = req.body;
        
        if (!product_name || !category_id || !variants || !Array.isArray(variants) || variants.length === 0) {
            return res.status(400).json({ 
                error: 'Product name, category ID, and at least one variant are required' 
            });
        }

        await client.query('BEGIN');

        // 1. Create the product
        const productResult = await client.query(
            'INSERT INTO products (product_name, category_id, is_active) VALUES ($1, $2, $3) RETURNING *',
            [product_name, category_id, is_active]
        );
        
        const product = productResult.rows[0];
        const productId = product.product_id;

        // 2. Create variants
        for (const variant of variants) {
            await client.query(
                `INSERT INTO product_variants 
                (product_id, size_label, price, is_default) 
                VALUES ($1, $2, $3, $4)`,
                [productId, variant.size_label, variant.price, variant.is_default || false]
            );
        }

        await client.query('COMMIT');
        
        // 3. Get the created product with its variants
        const result = await client.query(`
            SELECT p.*, 
                   json_agg(pv.*) as variants
            FROM products p
            LEFT JOIN product_variants pv ON p.product_id = pv.product_id
            WHERE p.product_id = $1
            GROUP BY p.product_id
        `, [productId]);

        res.status(201).json(result.rows[0]);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error creating product with variants:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        client.release();
    }
};

// Get all categories
export const getCategories = async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM category ORDER BY category_id');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Create product variant
export const createProductVariant = async (req, res) => {
    try {
        const { productId } = req.params;
        const { size_label, price, is_default = false } = req.body;
        
        // Input validation
        if (!size_label || price === undefined || price === null) {
            return res.status(400).json({ error: 'Size label and price are required' });
        }
        
        // If this variant is set as default, unset all other default variants for this product
        if (is_default) {
            await pool.query(
                'UPDATE product_variants SET is_default = false WHERE product_id = $1',
                [productId]
            );
        }
        
        const newVariant = await pool.query(
            'INSERT INTO product_variants (product_id, size_label, price, is_default) VALUES ($1, $2, $3, $4) RETURNING *',
            [productId, size_label, price, is_default]
        );
        
        res.status(201).json(newVariant.rows[0]);
    } catch (error) {
        console.error('Error creating product variant:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const getCategID = async (req,res) => 
{
    const  {category_id} = req.params;
    try {
        const result = await pool.query('SELECT from category WHERE category_id = $1', [category_id]);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}



