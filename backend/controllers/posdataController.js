import pool from '../config/db.js';

export const getPOSData = async (req, res) => {
  try {
    // Run all queries at the same time using Promise.all
    const [
      categoriesResult,
      productsResult,
      sugarLevelsResult,
      addonsResult,
      sizesResult,
      productsWithVariantsResult
    ] = await Promise.all([
      
      // 1. Categories
      pool.query(`SELECT * FROM category ORDER BY category_id`),

      // 2. Products (your joined + filtered version)
      pool.query(`
        SELECT p.*, c.category_name
        FROM products p
        LEFT JOIN category c ON p.category_id = c.category_id
        WHERE p.is_active = true
        ORDER BY p.product_name
      `),

      // 3. Sugar Levels
      pool.query(`SELECT sugarlevel_id as id, level_name FROM sugar_levels ORDER BY sugarlevel_id`),

      // 4. Addons
      pool.query(`SELECT add_id, extras_name, price FROM addons_item`),

      // 5. Sizes
      pool.query(`
        SELECT DISTINCT size_label 
        FROM product_variants 
        WHERE size_label IS NOT NULL 
        ORDER BY size_label
      `),

      // 6. Products with variants
      pool.query(`
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
        WHERE p.is_active = true
        GROUP BY p.product_id, c.category_name
        ORDER BY p.product_name
      `)
    ])

    // Transform products with no variants
    const productsWithVariants = productsWithVariantsResult.rows.map(row => ({
      ...row,
      variants: row.variants[0] ? row.variants : []
    }))

    // Build the final POS response object
    res.json({
      categories: categoriesResult.rows,
      products: productsResult.rows,
      sugarLevels: sugarLevelsResult.rows,
      addons: addonsResult.rows,
      sizes: sizesResult.rows,
      productsWithVariants
    })

  } catch (err) {
    console.error("Error loading POS data:", err)
    res.status(500).json({ error: "Internal server error" })
  }
}
