import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Dummy products with Unsplash URLs
const dummyProducts = [
  {
    name: "Wireless Bluetooth Headphones",
    price: 79.99,
    sku: "WBH-001",
    status: "active",
    category: "Electronics",
    stock: 45,
    rating: 4.5,
    image_url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop",
    description: "Premium wireless headphones with noise cancellation",
  },
  {
    name: "Organic Cotton T-Shirt",
    price: 29.99,
    sku: "OCT-002",
    status: "active",
    category: "Clothing",
    stock: 120,
    rating: 4.8,
    image_url: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop",
    description: "Comfortable organic cotton t-shirt, available in multiple colors",
  },
  {
    name: "Stainless Steel Water Bottle",
    price: 24.99,
    sku: "SSW-003",
    status: "active",
    category: "Accessories",
    stock: 80,
    rating: 4.7,
    image_url: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400&h=400&fit=crop",
    description: "Eco-friendly insulated water bottle, keeps drinks cold for 24 hours",
  },
  {
    name: "Leather Wallet",
    price: 49.99,
    sku: "LW-004",
    status: "active",
    category: "Accessories",
    stock: 35,
    rating: 4.6,
    image_url: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop",
    description: "Genuine leather wallet with RFID blocking technology",
  },
  {
    name: "Smart Watch",
    price: 199.99,
    sku: "SW-005",
    status: "active",
    category: "Electronics",
    stock: 25,
    rating: 4.9,
    image_url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop",
    description: "Feature-rich smartwatch with fitness tracking and notifications",
  },
  {
    name: "Ceramic Coffee Mug",
    price: 14.99,
    sku: "CCM-006",
    status: "out of stock",
    category: "Home & Kitchen",
    stock: 0,
    rating: 4.4,
    image_url: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400&h=400&fit=crop",
    description: "Handcrafted ceramic mug perfect for your morning coffee",
  },
  {
    name: "Yoga Mat",
    price: 34.99,
    sku: "YM-007",
    status: "active",
    category: "Fitness",
    stock: 60,
    rating: 4.5,
    image_url: "https://images.unsplash.com/photo-1601925260368-eee9a3c53b8a?w=400&h=400&fit=crop",
    description: "Non-slip yoga mat with carrying strap",
  },
  {
    name: "Backpack",
    price: 59.99,
    sku: "BP-008",
    status: "active",
    category: "Accessories",
    stock: 40,
    rating: 4.7,
    image_url: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop",
    description: "Durable backpack with laptop compartment and water-resistant material",
  },
  {
    name: "Wireless Mouse",
    price: 39.99,
    sku: "WM-009",
    status: "active",
    category: "Electronics",
    stock: 90,
    rating: 4.6,
    image_url: "https://images.unsplash.com/photo-1527814050087-3793815479db?w=400&h=400&fit=crop",
    description: "Ergonomic wireless mouse with long battery life",
  },
  {
    name: "Desk Lamp",
    price: 44.99,
    sku: "DL-010",
    status: "closed for sale",
    category: "Home & Kitchen",
    stock: 15,
    rating: 4.3,
    image_url: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400&h=400&fit=crop",
    description: "Modern LED desk lamp with adjustable brightness",
  },
];

async function seedDummyProducts(orgId: string) {
  console.log(`Seeding dummy products for organization: ${orgId}`);

  // Check if products table exists
  const { error: tableCheckError } = await supabase
    .from('products')
    .select('id')
    .limit(1);

  if (tableCheckError) {
    console.error('Products table does not exist. Please create it first.');
    console.error('Error:', tableCheckError);
    return;
  }

  // Insert products
  const productsToInsert = dummyProducts.map(product => ({
    ...product,
    org_id: orgId,
  }));

  const { data, error } = await supabase
    .from('products')
    .insert(productsToInsert)
    .select();

  if (error) {
    console.error('Error seeding products:', error);
    return;
  }

  console.log(`Successfully seeded ${data.length} products`);
  console.log('Products:', data.map(p => `- ${p.name} (${p.sku})`).join('\n'));
}

// Get orgId from command line argument
const orgId = process.argv[2];

if (!orgId) {
  console.error('Please provide an organization ID as an argument');
  console.error('Usage: tsx scripts/seed-dummy-products.ts <orgId>');
  process.exit(1);
}

seedDummyProducts(orgId)
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

