--
-- PostgreSQL database dump
--

\restrict yAGPIYGSowtrIPlhe9ArdNMxo0pPEuJ4krgvvrLJHTu82SORQiFpAMntbDGWhd8

-- Dumped from database version 18.0
-- Dumped by pg_dump version 18.0

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: add_cup_stock(character varying, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.add_cup_stock(p_size_label character varying, p_add_quantity integer) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
DECLARE
    current_stock INTEGER;
BEGIN
    -- Validate input
    IF p_add_quantity <= 0 THEN
        RAISE EXCEPTION 'Add quantity must be positive: %', p_add_quantity;
    END IF;
    
    -- Update stock atomically
    UPDATE cup_stock 
    SET stock_count = stock_count + p_add_quantity,
        updated_at = CURRENT_TIMESTAMP
    WHERE size_label = p_size_label
    RETURNING stock_count INTO current_stock;
    
    -- Insert if not found
    IF NOT FOUND THEN
        INSERT INTO cup_stock (size_label, stock_count)
        VALUES (p_size_label, p_add_quantity);
        current_stock := p_add_quantity;
    END IF;
    
    RETURN TRUE;
END;
$$;


ALTER FUNCTION public.add_cup_stock(p_size_label character varying, p_add_quantity integer) OWNER TO postgres;

--
-- Name: deduct_cup_stock(character varying, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.deduct_cup_stock(p_size_label character varying, p_quantity integer) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
DECLARE
    current_stock INTEGER;
BEGIN
    -- Validate input
    IF p_quantity <= 0 THEN
        RAISE EXCEPTION 'Quantity must be positive: %', p_quantity;
    END IF;
    
    -- Get current stock and check availability
    SELECT stock_count INTO current_stock
    FROM cup_stock 
    WHERE size_label = p_size_label;
    
    -- Insert with 0 stock if not found
    IF current_stock IS NULL THEN
        INSERT INTO cup_stock (size_label, stock_count)
        VALUES (p_size_label, 0);
        current_stock := 0;
    END IF;
    
    -- Check if enough stock is available
    IF current_stock < p_quantity THEN
        RAISE EXCEPTION 'Insufficient cup stock for %: available=%d, requested=%d', 
                        p_size_label, current_stock, p_quantity;
    END IF;
    
    -- Deduct stock
    UPDATE cup_stock 
    SET stock_count = stock_count - p_quantity,
        updated_at = CURRENT_TIMESTAMP
    WHERE size_label = p_size_label;
    
    RETURN TRUE;
END;
$$;


ALTER FUNCTION public.deduct_cup_stock(p_size_label character varying, p_quantity integer) OWNER TO postgres;

--
-- Name: get_cup_stock_status(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_cup_stock_status() RETURNS TABLE(size_label character varying, stock_count integer, stock_status character varying, status_color character varying, updated_at timestamp without time zone)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cs.size_label,
        cs.stock_count,
        CASE 
            WHEN cs.stock_count <= 0 THEN 'OUT OF STOCK'
            WHEN cs.stock_count <= 10 THEN 'LOW STOCK'
            ELSE 'IN STOCK'
        END as stock_status,
        CASE 
            WHEN cs.stock_count <= 0 THEN '#dc3545' -- Red
            WHEN cs.stock_count <= 10 THEN '#ffc107' -- Yellow
            ELSE '#28a745' -- Green
        END as status_color,
        cs.updated_at
    FROM cup_stock cs
    ORDER BY 
        CASE cs.size_label 
            WHEN '12oz' THEN 1
            WHEN '12 oz' THEN 1
            WHEN '16oz' THEN 2
            WHEN '16 oz' THEN 2
            WHEN '22oz' THEN 3
            WHEN '22 oz' THEN 3
            ELSE 4
        END;
END;
$$;


ALTER FUNCTION public.get_cup_stock_status() OWNER TO postgres;

--
-- Name: update_cashier_sessions_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_cashier_sessions_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_cashier_sessions_updated_at() OWNER TO postgres;

--
-- Name: update_cup_stock(character varying, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_cup_stock(p_size_label character varying, p_stock_count integer) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Validate input
    IF p_stock_count < 0 THEN
        RAISE EXCEPTION 'Stock count cannot be negative: %', p_stock_count;
    END IF;
    
    -- Update or insert stock
    INSERT INTO cup_stock (size_label, stock_count)
    VALUES (p_size_label, p_stock_count)
    ON CONFLICT (size_label) 
    DO UPDATE SET 
        stock_count = EXCLUDED.stock_count,
        updated_at = CURRENT_TIMESTAMP;
    
    RETURN TRUE;
END;
$$;


ALTER FUNCTION public.update_cup_stock(p_size_label character varying, p_stock_count integer) OWNER TO postgres;

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: addons_item; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.addons_item (
    add_id integer NOT NULL,
    extras_name character varying(200) NOT NULL,
    price numeric(10,2),
    is_default boolean DEFAULT true
);


ALTER TABLE public.addons_item OWNER TO postgres;

--
-- Name: addons_item_add_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.addons_item_add_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.addons_item_add_id_seq OWNER TO postgres;

--
-- Name: addons_item_add_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.addons_item_add_id_seq OWNED BY public.addons_item.add_id;


--
-- Name: cashier_sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cashier_sessions (
    session_id integer NOT NULL,
    cashier_id integer NOT NULL,
    business_date date DEFAULT CURRENT_DATE NOT NULL,
    starting_cash numeric(12,2) DEFAULT 0.00 NOT NULL,
    total_sales numeric(12,2) DEFAULT 0.00 NOT NULL,
    ending_cash numeric(12,2) GENERATED ALWAYS AS ((starting_cash + total_sales)) STORED,
    session_status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    opened_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    closed_at timestamp without time zone,
    created_by integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT cashier_sessions_session_status_check CHECK (((session_status)::text = ANY ((ARRAY['active'::character varying, 'closed'::character varying])::text[])))
);


ALTER TABLE public.cashier_sessions OWNER TO postgres;

--
-- Name: TABLE cashier_sessions; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.cashier_sessions IS 'Tracks daily cashier sessions including starting cash, total sales, and ending cash';


--
-- Name: COLUMN cashier_sessions.business_date; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.cashier_sessions.business_date IS 'The business date for this session (usually CURRENT_DATE)';


--
-- Name: COLUMN cashier_sessions.starting_cash; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.cashier_sessions.starting_cash IS 'Cash in drawer at start of day';


--
-- Name: COLUMN cashier_sessions.total_sales; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.cashier_sessions.total_sales IS 'Total sales amount for the day';


--
-- Name: COLUMN cashier_sessions.ending_cash; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.cashier_sessions.ending_cash IS 'Calculated ending cash (starting_cash + total_sales)';


--
-- Name: COLUMN cashier_sessions.session_status; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.cashier_sessions.session_status IS 'Session status: active or closed';


--
-- Name: cashier_sessions_session_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.cashier_sessions_session_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cashier_sessions_session_id_seq OWNER TO postgres;

--
-- Name: cashier_sessions_session_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.cashier_sessions_session_id_seq OWNED BY public.cashier_sessions.session_id;


--
-- Name: category; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.category (
    category_id integer NOT NULL,
    category_name character varying(100) NOT NULL,
    has_sizes boolean DEFAULT true
);


ALTER TABLE public.category OWNER TO postgres;

--
-- Name: category_category_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.category_category_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.category_category_id_seq OWNER TO postgres;

--
-- Name: category_category_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.category_category_id_seq OWNED BY public.category.category_id;


--
-- Name: cup_stock; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cup_stock (
    size_label character varying(50) NOT NULL,
    stock_count integer DEFAULT 0 NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_cup_stock_non_negative CHECK ((stock_count >= 0))
);


ALTER TABLE public.cup_stock OWNER TO postgres;

--
-- Name: daily_cash_drawer; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.daily_cash_drawer (
    business_date date NOT NULL,
    starting_cash numeric(10,2) DEFAULT 0.00 NOT NULL,
    created_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT positive_starting_cash CHECK ((starting_cash >= (0)::numeric))
);


ALTER TABLE public.daily_cash_drawer OWNER TO postgres;

--
-- Name: TABLE daily_cash_drawer; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.daily_cash_drawer IS 'Stores daily starting cash amounts for cash drawer reconciliation';


--
-- Name: COLUMN daily_cash_drawer.business_date; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.daily_cash_drawer.business_date IS 'Business date (primary key - one entry per day)';


--
-- Name: COLUMN daily_cash_drawer.starting_cash; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.daily_cash_drawer.starting_cash IS 'Starting cash amount for the business day';


--
-- Name: COLUMN daily_cash_drawer.created_by; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.daily_cash_drawer.created_by IS 'User who entered the starting cash amount';


--
-- Name: COLUMN daily_cash_drawer.created_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.daily_cash_drawer.created_at IS 'Timestamp when starting cash was recorded';


--
-- Name: daily_variant_stock; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.daily_variant_stock (
    stock_id integer NOT NULL,
    business_date date DEFAULT CURRENT_DATE NOT NULL,
    variant_id integer NOT NULL,
    opening_stock integer DEFAULT 0 NOT NULL,
    added_stock integer DEFAULT 0 NOT NULL,
    used_stock integer DEFAULT 0 NOT NULL,
    closing_stock integer GENERATED ALWAYS AS (((opening_stock + added_stock) - used_stock)) STORED,
    last_updated timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.daily_variant_stock OWNER TO postgres;

--
-- Name: TABLE daily_variant_stock; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.daily_variant_stock IS 'Tracks daily stock levels per product variant with carry-over functionality';


--
-- Name: COLUMN daily_variant_stock.business_date; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.daily_variant_stock.business_date IS 'The business date for stock tracking';


--
-- Name: COLUMN daily_variant_stock.variant_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.daily_variant_stock.variant_id IS 'Reference to product variant (size)';


--
-- Name: COLUMN daily_variant_stock.opening_stock; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.daily_variant_stock.opening_stock IS 'Stock carried over from previous day';


--
-- Name: COLUMN daily_variant_stock.added_stock; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.daily_variant_stock.added_stock IS 'New stock added during the day';


--
-- Name: COLUMN daily_variant_stock.used_stock; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.daily_variant_stock.used_stock IS 'Stock used/sold during the day';


--
-- Name: COLUMN daily_variant_stock.closing_stock; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.daily_variant_stock.closing_stock IS 'Calculated closing stock (opening + added - used)';


--
-- Name: daily_variant_stock_stock_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.daily_variant_stock_stock_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.daily_variant_stock_stock_id_seq OWNER TO postgres;

--
-- Name: daily_variant_stock_stock_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.daily_variant_stock_stock_id_seq OWNED BY public.daily_variant_stock.stock_id;


--
-- Name: daily_variant_usage; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.daily_variant_usage (
    usage_id integer NOT NULL,
    business_date date DEFAULT CURRENT_DATE NOT NULL,
    variant_id integer NOT NULL,
    quantity_used integer DEFAULT 0 NOT NULL,
    last_updated timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.daily_variant_usage OWNER TO postgres;

--
-- Name: TABLE daily_variant_usage; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.daily_variant_usage IS 'Tracks how many units of each product variant are used per day';


--
-- Name: COLUMN daily_variant_usage.business_date; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.daily_variant_usage.business_date IS 'The business date for usage tracking';


--
-- Name: COLUMN daily_variant_usage.variant_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.daily_variant_usage.variant_id IS 'Reference to product variant (size)';


--
-- Name: COLUMN daily_variant_usage.quantity_used; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.daily_variant_usage.quantity_used IS 'Total quantity of this variant used on this date';


--
-- Name: daily_variant_usage_usage_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.daily_variant_usage_usage_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.daily_variant_usage_usage_id_seq OWNER TO postgres;

--
-- Name: daily_variant_usage_usage_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.daily_variant_usage_usage_id_seq OWNED BY public.daily_variant_usage.usage_id;


--
-- Name: monthly_cash; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.monthly_cash (
    id integer NOT NULL,
    month date NOT NULL,
    starting_cash numeric(10,2) NOT NULL,
    created_by integer,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.monthly_cash OWNER TO postgres;

--
-- Name: monthly_cash_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.monthly_cash_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.monthly_cash_id_seq OWNER TO postgres;

--
-- Name: monthly_cash_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.monthly_cash_id_seq OWNED BY public.monthly_cash.id;


--
-- Name: monthly_reports; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.monthly_reports (
    id integer NOT NULL,
    month date NOT NULL,
    total_orders integer DEFAULT 0 NOT NULL,
    gross_sales numeric(12,2) DEFAULT 0.00 NOT NULL,
    starting_cash numeric(12,2) DEFAULT 0.00 NOT NULL,
    profit numeric(12,2) DEFAULT 0.00 NOT NULL,
    top_products jsonb DEFAULT '[]'::jsonb NOT NULL,
    pdf_file_path character varying(500),
    pdf_generated_at timestamp without time zone,
    created_by integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.monthly_reports OWNER TO postgres;

--
-- Name: TABLE monthly_reports; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.monthly_reports IS 'Stores monthly dashboard data including orders, sales, profits and generated PDF reports';


--
-- Name: COLUMN monthly_reports.month; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.monthly_reports.month IS 'First day of the month being reported (e.g., 2026-01-01 for January 2026)';


--
-- Name: COLUMN monthly_reports.top_products; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.monthly_reports.top_products IS 'JSON array containing top 3 products with name, quantity sold, and revenue';


--
-- Name: COLUMN monthly_reports.pdf_file_path; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.monthly_reports.pdf_file_path IS 'File path to the generated PDF report for this month';


--
-- Name: monthly_reports_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.monthly_reports_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.monthly_reports_id_seq OWNER TO postgres;

--
-- Name: monthly_reports_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.monthly_reports_id_seq OWNED BY public.monthly_reports.id;


--
-- Name: order_item_addons; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_item_addons (
    item_addon_id integer NOT NULL,
    order_item_id integer NOT NULL,
    add_id integer NOT NULL,
    quantity integer DEFAULT 1,
    CONSTRAINT order_item_addons_quantity_check CHECK ((quantity > 0))
);


ALTER TABLE public.order_item_addons OWNER TO postgres;

--
-- Name: order_item_addons_item_addon_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.order_item_addons_item_addon_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.order_item_addons_item_addon_id_seq OWNER TO postgres;

--
-- Name: order_item_addons_item_addon_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.order_item_addons_item_addon_id_seq OWNED BY public.order_item_addons.item_addon_id;


--
-- Name: order_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_items (
    order_item_id integer NOT NULL,
    order_id integer NOT NULL,
    product_id integer NOT NULL,
    variant_id integer NOT NULL,
    quantity integer NOT NULL,
    price_each numeric(10,2) NOT NULL,
    subtotal numeric(10,2) NOT NULL,
    sugarlevel_id integer,
    CONSTRAINT order_items_quantity_check CHECK ((quantity > 0))
);


ALTER TABLE public.order_items OWNER TO postgres;

--
-- Name: order_items_order_item_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.order_items_order_item_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.order_items_order_item_id_seq OWNER TO postgres;

--
-- Name: order_items_order_item_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.order_items_order_item_id_seq OWNED BY public.order_items.order_item_id;


--
-- Name: orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.orders (
    order_id integer NOT NULL,
    cashier_id integer,
    total_amount numeric(10,2) NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    session_id integer
);


ALTER TABLE public.orders OWNER TO postgres;

--
-- Name: orders_order_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.orders_order_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.orders_order_id_seq OWNER TO postgres;

--
-- Name: orders_order_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.orders_order_id_seq OWNED BY public.orders.order_id;


--
-- Name: out_of_stock_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.out_of_stock_requests (
    request_id integer NOT NULL,
    product_id integer NOT NULL,
    cashier_id integer NOT NULL,
    message text DEFAULT 'Product reported out of stock'::text,
    created_at timestamp without time zone DEFAULT now(),
    is_resolved boolean DEFAULT false
);


ALTER TABLE public.out_of_stock_requests OWNER TO postgres;

--
-- Name: out_of_stock_requests_request_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.out_of_stock_requests_request_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.out_of_stock_requests_request_id_seq OWNER TO postgres;

--
-- Name: out_of_stock_requests_request_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.out_of_stock_requests_request_id_seq OWNED BY public.out_of_stock_requests.request_id;


--
-- Name: product_variants; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.product_variants (
    variant_id integer NOT NULL,
    product_id integer NOT NULL,
    size_label character varying(50) NOT NULL,
    price numeric(10,2) NOT NULL,
    is_default boolean DEFAULT false
);


ALTER TABLE public.product_variants OWNER TO postgres;

--
-- Name: product_variants_variant_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.product_variants_variant_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.product_variants_variant_id_seq OWNER TO postgres;

--
-- Name: product_variants_variant_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.product_variants_variant_id_seq OWNED BY public.product_variants.variant_id;


--
-- Name: products; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.products (
    product_id integer NOT NULL,
    category_id integer,
    product_name character varying(200) NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.products OWNER TO postgres;

--
-- Name: products_product_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.products_product_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.products_product_id_seq OWNER TO postgres;

--
-- Name: products_product_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.products_product_id_seq OWNED BY public.products.product_id;


--
-- Name: sugar_levels; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sugar_levels (
    sugarlevel_id integer NOT NULL,
    level_name character varying(50) NOT NULL
);


ALTER TABLE public.sugar_levels OWNER TO postgres;

--
-- Name: sugar_levels_sugarlevel_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sugar_levels_sugarlevel_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sugar_levels_sugarlevel_id_seq OWNER TO postgres;

--
-- Name: sugar_levels_sugarlevel_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sugar_levels_sugarlevel_id_seq OWNED BY public.sugar_levels.sugarlevel_id;


--
-- Name: user_table; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_table (
    uid integer NOT NULL,
    username character varying(100) NOT NULL,
    full_name character varying(100),
    u_role text DEFAULT 'cashier'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT user_table_u_role_check CHECK ((u_role = ANY (ARRAY['admin'::text, 'cashier'::text])))
);


ALTER TABLE public.user_table OWNER TO postgres;

--
-- Name: TABLE user_table; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.user_table IS 'User table with username-only authentication and role-based access';


--
-- Name: COLUMN user_table.username; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.user_table.username IS 'Primary identifier for user login (no password required)';


--
-- Name: COLUMN user_table.u_role; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.user_table.u_role IS 'User role for access control (admin, cashier, etc.)';


--
-- Name: user_table_uid_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_table_uid_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_table_uid_seq OWNER TO postgres;

--
-- Name: user_table_uid_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_table_uid_seq OWNED BY public.user_table.uid;


--
-- Name: addons_item add_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.addons_item ALTER COLUMN add_id SET DEFAULT nextval('public.addons_item_add_id_seq'::regclass);


--
-- Name: cashier_sessions session_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cashier_sessions ALTER COLUMN session_id SET DEFAULT nextval('public.cashier_sessions_session_id_seq'::regclass);


--
-- Name: category category_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.category ALTER COLUMN category_id SET DEFAULT nextval('public.category_category_id_seq'::regclass);


--
-- Name: daily_variant_stock stock_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.daily_variant_stock ALTER COLUMN stock_id SET DEFAULT nextval('public.daily_variant_stock_stock_id_seq'::regclass);


--
-- Name: daily_variant_usage usage_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.daily_variant_usage ALTER COLUMN usage_id SET DEFAULT nextval('public.daily_variant_usage_usage_id_seq'::regclass);


--
-- Name: monthly_cash id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.monthly_cash ALTER COLUMN id SET DEFAULT nextval('public.monthly_cash_id_seq'::regclass);


--
-- Name: monthly_reports id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.monthly_reports ALTER COLUMN id SET DEFAULT nextval('public.monthly_reports_id_seq'::regclass);


--
-- Name: order_item_addons item_addon_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_item_addons ALTER COLUMN item_addon_id SET DEFAULT nextval('public.order_item_addons_item_addon_id_seq'::regclass);


--
-- Name: order_items order_item_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items ALTER COLUMN order_item_id SET DEFAULT nextval('public.order_items_order_item_id_seq'::regclass);


--
-- Name: orders order_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders ALTER COLUMN order_id SET DEFAULT nextval('public.orders_order_id_seq'::regclass);


--
-- Name: out_of_stock_requests request_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.out_of_stock_requests ALTER COLUMN request_id SET DEFAULT nextval('public.out_of_stock_requests_request_id_seq'::regclass);


--
-- Name: product_variants variant_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_variants ALTER COLUMN variant_id SET DEFAULT nextval('public.product_variants_variant_id_seq'::regclass);


--
-- Name: products product_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products ALTER COLUMN product_id SET DEFAULT nextval('public.products_product_id_seq'::regclass);


--
-- Name: sugar_levels sugarlevel_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sugar_levels ALTER COLUMN sugarlevel_id SET DEFAULT nextval('public.sugar_levels_sugarlevel_id_seq'::regclass);


--
-- Name: user_table uid; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_table ALTER COLUMN uid SET DEFAULT nextval('public.user_table_uid_seq'::regclass);


--
-- Data for Name: addons_item; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.addons_item (add_id, extras_name, price, is_default) FROM stdin;
1	espresso	30.00	t
2	Cold Brew Coffee	20.00	t
3	Ice Cream	18.00	t
4	Fruit Jam	18.00	t
5	Nata De Coco	18.00	t
6	Syrup	18.00	t
\.


--
-- Data for Name: cashier_sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cashier_sessions (session_id, cashier_id, business_date, starting_cash, total_sales, session_status, opened_at, closed_at, created_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: category; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.category (category_id, category_name, has_sizes) FROM stdin;
1	Cold Brew Coffee	t
2	Hot Coffee	t
4	Espresso Based(Iced)	t
5	Non-Coffee	t
6	OD Milkshake	t
7	OD Fuzz	t
8	Milk-Based	t
9	OD Lemonade	t
10	OD Float	t
11	OD's after hours	t
12	Protein (Iced/Ice Blended)	t
3	Pastries	f
\.


--
-- Data for Name: cup_stock; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cup_stock (size_label, stock_count, updated_at) FROM stdin;
12oz	82	2026-01-26 20:53:27.942056
22oz	94	2026-02-06 14:45:44.016431
16oz	97	2026-02-06 15:14:37.414345
\.


--
-- Data for Name: daily_cash_drawer; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.daily_cash_drawer (business_date, starting_cash, created_by, created_at) FROM stdin;
2026-01-25	100.00	\N	2026-01-25 00:00:09.454518
2026-01-26	200.00	\N	2026-01-26 00:01:16.525046
2026-02-06	200.00	\N	2026-02-06 14:56:49.83916
\.


--
-- Data for Name: daily_variant_stock; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.daily_variant_stock (stock_id, business_date, variant_id, opening_stock, added_stock, used_stock, last_updated) FROM stdin;
1	2026-01-23	114	10	40	10	2026-01-24 21:13:44.54963
4	2026-01-24	114	40	15	3	2026-01-24 21:14:22.925212
8	2026-01-24	44	0	0	1	2026-01-24 22:30:44.683043
6	2026-01-24	31	0	0	11	2026-01-24 22:39:52.876241
11	2026-01-24	30	0	0	19	2026-01-25 00:02:47.327916
12	2026-01-24	98	0	0	11	2026-01-25 00:02:56.68213
13	2026-01-25	31	-11	0	3	2026-01-25 23:01:58.512528
14	2026-01-26	19	0	0	7	2026-01-26 20:53:28.051655
16	2026-02-06	94	0	0	5	2026-02-06 14:45:44.215186
17	2026-02-06	57	0	0	5	2026-02-06 14:45:49.44696
18	2026-02-06	30	0	0	4	2026-02-06 14:56:26.172825
\.


--
-- Data for Name: daily_variant_usage; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.daily_variant_usage (usage_id, business_date, variant_id, quantity_used, last_updated) FROM stdin;
1	2026-01-24	114	3	2026-01-24 21:14:22.925212
5	2026-01-24	44	2	2026-01-24 22:30:44.696283
2	2026-01-24	31	22	2026-01-24 22:39:52.894218
12	2026-01-24	30	38	2026-01-25 00:02:47.356662
14	2026-01-24	98	22	2026-01-25 00:02:56.692431
16	2026-01-25	31	6	2026-01-25 23:01:58.538465
18	2026-01-26	19	14	2026-01-26 20:53:28.058285
22	2026-02-06	94	10	2026-02-06 14:45:44.264318
24	2026-02-06	57	10	2026-02-06 14:45:49.455422
26	2026-02-06	30	8	2026-02-06 14:56:26.195244
\.


--
-- Data for Name: monthly_cash; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.monthly_cash (id, month, starting_cash, created_by, created_at) FROM stdin;
1	2026-01-01	50000.00	3	2026-01-08 23:37:16.857059+08
2	2025-12-01	50000.00	3	2026-01-08 23:44:59.797821+08
\.


--
-- Data for Name: monthly_reports; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.monthly_reports (id, month, total_orders, gross_sales, starting_cash, profit, top_products, pdf_file_path, pdf_generated_at, created_by, created_at, updated_at) FROM stdin;
3	2025-12-01	20	6643.00	50000.00	-43357.00	[{"total_sold": 22, "product_name": "Angelo's Fave", "total_revenue": 1914}, {"total_sold": 10, "product_name": "Americano", "total_revenue": 570}, {"total_sold": 5, "product_name": "Blackberry Fuzz", "total_revenue": 375}]	monthly-report-2025-12.pdf	2026-01-17 16:39:17.72888	3	2026-01-12 01:30:22.092426	2026-01-17 16:39:17.72888
\.


--
-- Data for Name: order_item_addons; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_item_addons (item_addon_id, order_item_id, add_id, quantity) FROM stdin;
\.


--
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.order_items (order_item_id, order_id, product_id, variant_id, quantity, price_each, subtotal, sugarlevel_id) FROM stdin;
103	76	22	30	4	87.00	348.00	3
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.orders (order_id, cashier_id, total_amount, created_at, session_id) FROM stdin;
76	4	348.00	2026-02-06 14:56:26.146784	\N
\.


--
-- Data for Name: out_of_stock_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.out_of_stock_requests (request_id, product_id, cashier_id, message, created_at, is_resolved) FROM stdin;
\.


--
-- Data for Name: product_variants; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.product_variants (variant_id, product_id, size_label, price, is_default) FROM stdin;
114	57	22oz	67.00	f
95	57	16oz	57.00	f
115	64	22oz	79.00	f
1	1	16oz	47.00	t
2	1	22oz	57.00	t
3	2	16oz	67.00	t
4	2	22oz	77.00	t
5	3	16oz	67.00	t
6	3	22oz	77.00	t
7	4	16oz	67.00	t
8	4	22oz	77.00	t
9	5	16oz	67.00	t
10	5	22oz	77.00	t
11	6	16oz	67.00	t
12	6	22oz	77.00	t
13	7	16oz	67.00	t
14	7	22oz	77.00	t
15	8	16oz	67.00	t
16	8	22oz	77.00	t
17	9	16oz	77.00	t
18	9	22oz	87.00	t
35	27	16oz	77.00	t
37	28	16oz	77.00	t
38	28	22oz	87.00	t
39	29	16oz	77.00	t
40	29	22oz	87.00	t
41	30	16oz	77.00	t
42	30	22oz	87.00	t
43	31	16oz	67.00	t
44	31	22oz	77.00	t
45	32	16oz	67.00	t
46	32	22oz	77.00	t
47	33	16oz	57.00	t
48	33	22oz	67.00	t
49	34	16oz	57.00	t
50	34	22oz	67.00	t
51	35	16oz	57.00	t
52	35	22oz	67.00	t
53	36	16oz	57.00	t
54	36	22oz	67.00	t
55	37	16oz	67.00	t
56	37	22oz	77.00	t
57	38	16oz	67.00	t
58	38	22oz	77.00	t
59	39	16oz	67.00	t
60	39	22oz	77.00	t
61	40	16oz	57.00	t
62	40	22oz	67.00	t
63	41	16oz	57.00	t
64	41	22oz	67.00	t
65	42	16oz	67.00	t
66	42	22oz	77.00	t
67	43	16oz	67.00	t
68	43	22oz	77.00	t
69	44	16oz	67.00	t
70	44	22oz	77.00	t
71	45	16oz	67.00	t
72	45	22oz	77.00	t
73	46	16oz	67.00	t
74	46	22oz	77.00	t
75	47	16oz	47.00	t
76	47	22oz	57.00	t
77	48	16oz	57.00	t
78	48	22oz	67.00	t
79	49	16oz	57.00	t
80	49	22oz	67.00	t
81	50	16oz	57.00	t
82	50	22oz	67.00	t
83	51	16oz	57.00	t
84	51	22oz	67.00	t
85	52	16oz	57.00	t
86	52	22oz	67.00	t
87	53	16oz	57.00	t
88	53	22oz	67.00	t
89	54	16oz	57.00	t
90	54	22oz	67.00	t
91	55	16oz	57.00	t
92	55	22oz	67.00	t
93	56	16oz	57.00	t
94	56	22oz	67.00	t
96	58	16oz	77.00	f
97	59	16oz	77.00	f
98	60	16oz	87.00	f
99	61	22oz	79.00	f
100	62	22oz	79.00	f
101	63	22oz	79.00	f
19	10	12oz	57.00	f
20	11	12oz	87.00	f
21	12	12oz	87.00	f
22	13	12oz	87.00	f
23	14	12oz	87.00	f
24	15	12oz	87.00	f
25	17	16oz	57.00	f
26	18	16oz	87.00	f
27	19	16oz	87.00	f
28	20	16oz	87.00	f
29	21	16oz	87.00	f
30	22	16oz	87.00	f
31	23	12oz	77.00	f
32	24	12oz	77.00	f
33	25	12oz	77.00	f
34	26	12oz	77.00	f
102	65	Standard	39.00	t
103	66	Standard	49.00	t
104	67	Standard	59.00	t
105	68	Standard	49.00	t
106	69	Standard	20.00	t
107	70	Standard	59.00	t
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.products (product_id, category_id, product_name, is_active, created_at) FROM stdin;
2	1	Iced Spanish Latte	t	2025-12-02 01:44:57.874488
3	1	Iced Caramel Macchiato	t	2025-12-02 01:45:09.07162
4	1	Iced Salted Caramel	t	2025-12-02 01:45:24.115599
5	1	Iced Coffee Hazelnut	t	2025-12-02 01:45:31.771888
6	1	Iced Coffee Vanilla	t	2025-12-02 01:45:46.451053
7	1	Iced Coffee Toffee	t	2025-12-02 01:45:53.950774
8	1	Iced Coffee Butterscotch	t	2025-12-02 01:46:00.118814
9	1	Irish Cream	t	2025-12-02 01:46:07.343944
11	2	Spanish Latte	t	2025-12-02 01:46:41.926405
12	2	Caramel Macchiato	t	2025-12-02 01:46:49.918613
14	2	Vanilla	t	2025-12-02 01:46:59.866689
15	2	Butterscotch	t	2025-12-02 01:47:08.239222
17	4	Dad's Favorite	t	2025-12-02 01:47:51.893101
18	4	Mom's Favorite	t	2025-12-02 01:48:09.342447
19	4	Golden Hour Caramel	t	2025-12-02 01:48:16.556146
20	4	Salty But Sweet(Salted Caramel)	t	2025-12-02 01:48:35.298724
21	4	The Classic(Hazelnut)	t	2025-12-02 01:48:50.142433
24	5	Matcha	t	2025-12-02 01:49:23.673067
25	5	Chocolate	t	2025-12-02 01:49:28.474858
26	5	Butterscotch	t	2025-12-02 01:49:34.165526
27	5	Caramel	t	2025-12-02 01:49:38.096763
28	6	Strawberry Milkshake	t	2025-12-02 01:49:55.168275
29	6	Blueberry Milkshake	t	2025-12-02 01:50:03.99144
30	6	Mango Milkshake	t	2025-12-02 01:50:09.390064
31	6	Java Chip Milkshake	t	2025-12-02 01:50:15.197075
32	6	Chocolate Milkshake	t	2025-12-02 01:50:21.553342
33	6	Cookies and Cream	t	2025-12-02 01:50:31.451232
34	7	Watermelon Fuzz	t	2025-12-02 01:50:47.852492
36	7	Lychee Fuzz	t	2025-12-02 01:50:57.612433
37	7	Strawberry Fuzz	t	2025-12-02 01:51:02.53172
39	7	Raspberry Fuzz	t	2025-12-02 01:51:10.728732
40	7	Green Apple Fuzz	t	2025-12-02 01:51:16.827582
41	8	Chocolate	t	2025-12-02 01:51:30.815435
42	8	Strawberry	t	2025-12-02 01:51:35.545202
43	8	Caramel	t	2025-12-02 01:52:02.621804
44	8	Toffee	t	2025-12-02 01:52:05.964233
45	8	Butterscotch	t	2025-12-02 01:52:12.353466
46	8	Choco Strawberry	t	2025-12-02 01:52:20.017336
47	8	Matcha	t	2025-12-02 01:52:26.187009
48	9	Lemonade	t	2025-12-02 01:52:34.271493
49	9	Yakulade	t	2025-12-02 01:52:38.134291
50	9	Strawberry Lemonade	t	2025-12-02 01:52:43.807616
51	9	Blueberry Lemonade	t	2025-12-02 01:52:48.575607
52	9	Honey Peach Lemonade	t	2025-12-02 01:52:53.671344
53	10	Cola	t	2025-12-02 01:53:05.566224
54	10	Root Beer	t	2025-12-02 01:53:11.344377
55	10	Strawberry	t	2025-12-02 01:53:20.352945
56	10	Blueberry	t	2025-12-02 01:53:24.751163
58	11	Darjuan's Fuzzy Buzzy	t	2025-12-02 01:53:45.087579
59	11	Sixto's Heart Stopper	t	2025-12-02 01:53:59.451765
61	11	Zestpresso	t	2025-12-02 01:54:28.486796
62	12	Chocolate	t	2025-12-02 01:54:41.568683
63	12	Vanila	t	2025-12-02 01:54:46.949834
64	12	Strawberry	t	2025-12-02 01:54:51.721462
65	3	Classic	t	2025-12-04 17:10:34.547484
66	3	S'Mores	t	2025-12-04 17:12:13.4968
68	3	Red Velvet	t	2025-12-04 17:12:37.674912
69	3	Mini Cookies	t	2025-12-04 17:12:46.813587
70	3	Classic Brownies	t	2025-12-04 17:12:57.314258
57	10	Green Apple	t	2025-12-02 01:53:28.87412
1	1	Iced Americano	t	2025-12-02 01:44:35.388706
38	7	Blackberry Fuzz	t	2025-12-02 01:51:06.82852
35	7	Blueberry Fuzz	t	2025-12-02 01:50:52.847121
10	2	Americano	t	2025-12-02 01:46:35.622293
23	4	Ashleys's Fave(Butterscotch)	t	2025-12-02 01:49:09.32634
67	3	Triple Chocolate	t	2025-12-04 17:12:27.386753
22	4	Angelo's Fave	t	2025-12-02 01:48:55.815317
60	11	34's Favorite	t	2025-12-02 01:54:22.430332
13	2	Hazelnut	t	2025-12-02 01:46:55.679496
\.


--
-- Data for Name: sugar_levels; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sugar_levels (sugarlevel_id, level_name) FROM stdin;
1	0%
2	25%
3	50%
4	75%
5	100%
\.


--
-- Data for Name: user_table; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_table (uid, username, full_name, u_role, created_at) FROM stdin;
4	try	try	cashier	2025-12-03 22:10:20.836105
6	testing1	test	cashier	2025-12-04 22:29:39.122438
7	123	retd	cashier	2025-12-05 17:41:56.426905
10	Lll	Oooo	cashier	2026-01-26 20:51:57.845884
3	MichaelMarquez	Michael Angelo Marquez	admin	2025-12-02 01:42:51.22689
\.


--
-- Name: addons_item_add_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.addons_item_add_id_seq', 1, false);


--
-- Name: cashier_sessions_session_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.cashier_sessions_session_id_seq', 1, false);


--
-- Name: category_category_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.category_category_id_seq', 3, true);


--
-- Name: daily_variant_stock_stock_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.daily_variant_stock_stock_id_seq', 18, true);


--
-- Name: daily_variant_usage_usage_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.daily_variant_usage_usage_id_seq', 27, true);


--
-- Name: monthly_cash_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.monthly_cash_id_seq', 2, true);


--
-- Name: monthly_reports_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.monthly_reports_id_seq', 3, true);


--
-- Name: order_item_addons_item_addon_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.order_item_addons_item_addon_id_seq', 157, true);


--
-- Name: order_items_order_item_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.order_items_order_item_id_seq', 103, true);


--
-- Name: orders_order_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.orders_order_id_seq', 76, true);


--
-- Name: out_of_stock_requests_request_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.out_of_stock_requests_request_id_seq', 1, false);


--
-- Name: product_variants_variant_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.product_variants_variant_id_seq', 138, true);


--
-- Name: products_product_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.products_product_id_seq', 111, true);


--
-- Name: sugar_levels_sugarlevel_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sugar_levels_sugarlevel_id_seq', 5, true);


--
-- Name: user_table_uid_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_table_uid_seq', 10, true);


--
-- Name: addons_item addons_item_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.addons_item
    ADD CONSTRAINT addons_item_pkey PRIMARY KEY (add_id);


--
-- Name: cashier_sessions cashier_sessions_cashier_id_business_date_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cashier_sessions
    ADD CONSTRAINT cashier_sessions_cashier_id_business_date_key UNIQUE (cashier_id, business_date);


--
-- Name: cashier_sessions cashier_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cashier_sessions
    ADD CONSTRAINT cashier_sessions_pkey PRIMARY KEY (session_id);


--
-- Name: category category_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.category
    ADD CONSTRAINT category_pkey PRIMARY KEY (category_id);


--
-- Name: cup_stock cup_stock_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cup_stock
    ADD CONSTRAINT cup_stock_pkey PRIMARY KEY (size_label);


--
-- Name: daily_cash_drawer daily_cash_drawer_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.daily_cash_drawer
    ADD CONSTRAINT daily_cash_drawer_pkey PRIMARY KEY (business_date);


--
-- Name: daily_variant_stock daily_variant_stock_business_date_variant_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.daily_variant_stock
    ADD CONSTRAINT daily_variant_stock_business_date_variant_id_key UNIQUE (business_date, variant_id);


--
-- Name: daily_variant_stock daily_variant_stock_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.daily_variant_stock
    ADD CONSTRAINT daily_variant_stock_pkey PRIMARY KEY (stock_id);


--
-- Name: daily_variant_usage daily_variant_usage_business_date_variant_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.daily_variant_usage
    ADD CONSTRAINT daily_variant_usage_business_date_variant_id_key UNIQUE (business_date, variant_id);


--
-- Name: daily_variant_usage daily_variant_usage_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.daily_variant_usage
    ADD CONSTRAINT daily_variant_usage_pkey PRIMARY KEY (usage_id);


--
-- Name: monthly_cash monthly_cash_month_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.monthly_cash
    ADD CONSTRAINT monthly_cash_month_key UNIQUE (month);


--
-- Name: monthly_cash monthly_cash_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.monthly_cash
    ADD CONSTRAINT monthly_cash_pkey PRIMARY KEY (id);


--
-- Name: monthly_reports monthly_reports_month_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.monthly_reports
    ADD CONSTRAINT monthly_reports_month_key UNIQUE (month);


--
-- Name: monthly_reports monthly_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.monthly_reports
    ADD CONSTRAINT monthly_reports_pkey PRIMARY KEY (id);


--
-- Name: order_item_addons order_item_addons_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_item_addons
    ADD CONSTRAINT order_item_addons_pkey PRIMARY KEY (item_addon_id);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (order_item_id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (order_id);


--
-- Name: out_of_stock_requests out_of_stock_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.out_of_stock_requests
    ADD CONSTRAINT out_of_stock_requests_pkey PRIMARY KEY (request_id);


--
-- Name: product_variants product_variants_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_variants
    ADD CONSTRAINT product_variants_pkey PRIMARY KEY (variant_id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (product_id);


--
-- Name: sugar_levels sugar_levels_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sugar_levels
    ADD CONSTRAINT sugar_levels_pkey PRIMARY KEY (sugarlevel_id);


--
-- Name: user_table user_table_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_table
    ADD CONSTRAINT user_table_pkey PRIMARY KEY (uid);


--
-- Name: user_table user_table_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_table
    ADD CONSTRAINT user_table_username_key UNIQUE (username);


--
-- Name: idx_cashier_sessions_cashier_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cashier_sessions_cashier_date ON public.cashier_sessions USING btree (cashier_id, business_date);


--
-- Name: idx_cashier_sessions_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cashier_sessions_date ON public.cashier_sessions USING btree (business_date);


--
-- Name: idx_cup_stock_label; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_cup_stock_label ON public.cup_stock USING btree (size_label);


--
-- Name: idx_daily_cash_drawer_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_daily_cash_drawer_date ON public.daily_cash_drawer USING btree (business_date);


--
-- Name: idx_daily_variant_stock_date_variant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_daily_variant_stock_date_variant ON public.daily_variant_stock USING btree (business_date, variant_id);


--
-- Name: idx_daily_variant_usage_date_variant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_daily_variant_usage_date_variant ON public.daily_variant_usage USING btree (business_date, variant_id);


--
-- Name: idx_monthly_reports_created_by; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_monthly_reports_created_by ON public.monthly_reports USING btree (created_by);


--
-- Name: idx_monthly_reports_month; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_monthly_reports_month ON public.monthly_reports USING btree (month);


--
-- Name: idx_order_items_order_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_order_items_order_id ON public.order_items USING btree (order_id);


--
-- Name: idx_order_items_product_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_order_items_product_id ON public.order_items USING btree (product_id);


--
-- Name: idx_orders_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orders_created_at ON public.orders USING btree (created_at);


--
-- Name: idx_orders_session_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orders_session_id ON public.orders USING btree (session_id);


--
-- Name: idx_user_table_username; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_table_username ON public.user_table USING btree (username);


--
-- Name: cashier_sessions update_cashier_sessions_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_cashier_sessions_updated_at BEFORE UPDATE ON public.cashier_sessions FOR EACH ROW EXECUTE FUNCTION public.update_cashier_sessions_updated_at();


--
-- Name: monthly_reports update_monthly_reports_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_monthly_reports_updated_at BEFORE UPDATE ON public.monthly_reports FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: cashier_sessions cashier_sessions_cashier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cashier_sessions
    ADD CONSTRAINT cashier_sessions_cashier_id_fkey FOREIGN KEY (cashier_id) REFERENCES public.user_table(uid);


--
-- Name: cashier_sessions cashier_sessions_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cashier_sessions
    ADD CONSTRAINT cashier_sessions_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.user_table(uid);


--
-- Name: daily_cash_drawer daily_cash_drawer_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.daily_cash_drawer
    ADD CONSTRAINT daily_cash_drawer_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.user_table(uid);


--
-- Name: daily_variant_stock daily_variant_stock_variant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.daily_variant_stock
    ADD CONSTRAINT daily_variant_stock_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.product_variants(variant_id);


--
-- Name: daily_variant_usage daily_variant_usage_variant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.daily_variant_usage
    ADD CONSTRAINT daily_variant_usage_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.product_variants(variant_id);


--
-- Name: monthly_cash monthly_cash_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.monthly_cash
    ADD CONSTRAINT monthly_cash_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.user_table(uid);


--
-- Name: monthly_reports monthly_reports_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.monthly_reports
    ADD CONSTRAINT monthly_reports_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.user_table(uid);


--
-- Name: order_item_addons order_item_addons_add_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_item_addons
    ADD CONSTRAINT order_item_addons_add_id_fkey FOREIGN KEY (add_id) REFERENCES public.addons_item(add_id);


--
-- Name: order_item_addons order_item_addons_order_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_item_addons
    ADD CONSTRAINT order_item_addons_order_item_id_fkey FOREIGN KEY (order_item_id) REFERENCES public.order_items(order_item_id) ON DELETE CASCADE;


--
-- Name: order_items order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(order_id) ON DELETE CASCADE;


--
-- Name: order_items order_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(product_id);


--
-- Name: order_items order_items_sugarlevel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_sugarlevel_id_fkey FOREIGN KEY (sugarlevel_id) REFERENCES public.sugar_levels(sugarlevel_id);


--
-- Name: order_items order_items_variant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.product_variants(variant_id);


--
-- Name: orders orders_cashier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_cashier_id_fkey FOREIGN KEY (cashier_id) REFERENCES public.user_table(uid);


--
-- Name: orders orders_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.cashier_sessions(session_id);


--
-- Name: out_of_stock_requests out_of_stock_requests_cashier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.out_of_stock_requests
    ADD CONSTRAINT out_of_stock_requests_cashier_id_fkey FOREIGN KEY (cashier_id) REFERENCES public.user_table(uid);


--
-- Name: out_of_stock_requests out_of_stock_requests_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.out_of_stock_requests
    ADD CONSTRAINT out_of_stock_requests_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(product_id);


--
-- Name: product_variants product_variants_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.product_variants
    ADD CONSTRAINT product_variants_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(product_id) ON DELETE CASCADE;


--
-- Name: products products_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.category(category_id) ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict yAGPIYGSowtrIPlhe9ArdNMxo0pPEuJ4krgvvrLJHTu82SORQiFpAMntbDGWhd8

