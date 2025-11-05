CREATE TABLE Staff (
    staff_id INT PRIMARY KEY,
    username VARCHAR(255),
    password VARCHAR(255),
    permissions BOOLEAN
);

CREATE TABLE Menu_Items (
    menu_item_id INT PRIMARY KEY,
    name VARCHAR(255),
    upcharge DOUBLE PRECISION,
    is_available BOOLEAN,
    item_type VARCHAR(50) -- 'entree', 'side', 'drink', etc.
);

CREATE TABLE Inventory (
    inventory_id INT PRIMARY KEY,
    menu_item_id INT,
    stock INT,
    reorder BOOLEAN,
    FOREIGN KEY (menu_item_id) REFERENCES Menu_Items(menu_item_id)
);

CREATE TABLE Non_Food_Inventory (
    supply_id INT PRIMARY KEY,
    name VARCHAR(255),
    stock INT,
    reorder BOOLEAN
);

CREATE TABLE Meal_Types (
    meal_type_id INT PRIMARY KEY,
    meal_type_name VARCHAR(255),
    meal_type_price DOUBLE PRECISION,
    entree_count INT,
    side_count INT,
    drink_size VARCHAR(50)
);

CREATE TABLE "Order" (
    order_id SERIAL PRIMARY KEY,
    staff_id INT,
    datetime TIMESTAMP,
    meal_id INT,
    price DOUBLE PRECISION,
    FOREIGN KEY (staff_id) REFERENCES Staff(staff_id)
);

CREATE TABLE Meal (
    meal_id SERIAL PRIMARY KEY,
    order_id INT,
    meal_type_id INT,
    FOREIGN KEY (order_id) REFERENCES "Order"(order_id),
    FOREIGN KEY (meal_type_id) REFERENCES Meal_Types(meal_type_id)
);

CREATE TABLE Meal_Detail (
    detail_id SERIAL PRIMARY KEY,
    meal_id INT,
    meal_type_id INT,
    menu_item_id INT,
    role VARCHAR(50), -- 'entree', 'side', etc.
    FOREIGN KEY (meal_id) REFERENCES Meal(meal_id),
    FOREIGN KEY (meal_type_id) REFERENCES Meal_Types(meal_type_id),
    FOREIGN KEY (menu_item_id) REFERENCES Menu_Items(menu_item_id)
);

CREATE TABLE Payment (
    payment_id INT PRIMARY KEY,
    order_id INT,
    method VARCHAR(255),
    amount DECIMAL(10, 2),
    FOREIGN KEY (order_id) REFERENCES "Order"(order_id)
);

CREATE TABLE DailySummaries (
    summary_id SERIAL PRIMARY KEY,
    business_date DATE NOT NULL UNIQUE,
    total_sales DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    total_tax DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    net_sales DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    order_count INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL CHECK (status IN ('OPEN', 'CLOSED')),
    opened_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP WITH TIME ZONE
);