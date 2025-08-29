import { Request, Response } from 'express';
import dataService from '../services/dataService';
import { safeRedis } from '../config/redis';

export class ProductController {
  // GET /api/products
  async getAllProducts(req: Request, res: Response): Promise<void> {
    try {
      const cacheKey = 'products:all';
      
      // Try to get from cache first
      const cached = await safeRedis.get(cacheKey);
      if (cached) {
        res.json(JSON.parse(cached));
        return;
      }

      // If not in cache, get from database
      const products = await dataService.getAllProducts();
      
      // Cache the result for 5 minutes
      await safeRedis.set(cacheKey, JSON.stringify(products), { EX: 300 });

      res.json(products);
    } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // GET /api/products/category/:category
  async getProductsByCategory(req: Request, res: Response): Promise<void> {
    try {
      const { category } = req.params;
      const products = await dataService.getProductsByCategory(category);

      if (!products || products.length === 0) {
        res.status(404).json({ error: 'No products found in this category' });
        return;
      }

      res.json(products);
    } catch (error) {
      console.error('Error fetching products by category:', error);
      res.status(500).json({ error: 'Failed to fetch products by category' });
    }
  }

  // GET /api/products/subcategory/:subcategory
  async getProductsBySubcategory(req: Request, res: Response): Promise<void> {
    try {
      const { subcategory } = req.params;
      const products = await dataService.getProductsBySubcategory(subcategory);

      if (!products || products.length === 0) {
        res.status(404).json({ error: 'No products found in this subcategory' });
        return;
      }

      res.json(products);
    } catch (error) {
      console.error('Error fetching products by subcategory:', error);
      res.status(500).json({ error: 'Failed to fetch products by subcategory' });
    }
  }

  // GET /api/products/category/:category/subcategory/:subcategory
  async getProductsByCategoryAndSubcategory(req: Request, res: Response): Promise<void> {
    try {
      const { category, subcategory } = req.params;
      const products = await dataService.getProductsByCategoryAndSubcategory(category, subcategory);

      if (!products || products.length === 0) {
        res.status(404).json({ error: 'No products found in this category and subcategory' });
        return;
      }

      res.json(products);
    } catch (error) {
      console.error('Error fetching products by category and subcategory:', error);
      res.status(500).json({ error: 'Failed to fetch products by category and subcategory' });
    }
  }

  // GET /api/products/:id
  async getProductById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const product = await dataService.getProductById(id);

      if (!product) {
        res.status(404).json({ error: 'Product not found' });
        return;
      }

      res.json(product);
    } catch (error) {
      console.error('Error fetching product:', error);
      res.status(500).json({ error: 'Failed to fetch product' });
    }
  }

  // POST /api/products
  async createProduct(req: Request, res: Response): Promise<void> {
    try {
      const { name, price, description, category, subcategory, image, stock, rating, reviews, taxId } = req.body;

      if (!name || price == null || !description || !category) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      // Tax is now mandatory - if no tax is provided, we'll set default 10% tax
      let finalTaxId = taxId;
      if (!finalTaxId) {
        // Get the default 10% tax
        const defaultTax = await dataService.getTaxByRate(10);
        if (!defaultTax) {
          res.status(500).json({ error: 'Default 10% tax not found. Please create it first.' });
          return;
        }
        finalTaxId = defaultTax.id;
      }

      const product = await dataService.createProduct({
        name,
        price,
        description,
        category,
        subcategory: subcategory || null,
        image: image || '',
        stock: stock ?? 0,
        rating: rating ?? 0,
        reviews: reviews ?? 0,
        taxId: finalTaxId
      });

      res.status(201).json(product);
    } catch (error) {
      console.error('Error creating product:', error);
      res.status(500).json({ error: 'Failed to create product' });
    }
  }

// PATCH /api/products/:id
async patchProduct(req: Request, res: Response): Promise<void> {
try {
  const { id } = req.params;
  const updates = req.body;

  const product = await dataService.updateProduct(id, updates);

  if (!product) {
    res.status(404).json({ error: 'Product not found' });
    return;
  }

  // Invalidate Redis cache to ensure fresh data is served
  try {
    await safeRedis.del('products:all');
  } catch (cacheError) {
    console.error('Failed to invalidate product cache:', cacheError);
    // Don't fail the request if cache invalidation fails
  }

  res.json(product);
} catch (error) {
  console.error('Error patching product:', error);
  res.status(500).json({ error: 'Failed to patch product' });
}
}

  // DELETE /api/products/:id
  async deleteProduct(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await dataService.deleteProduct(id);

      if (!deleted) {
        res.status(404).json({ error: 'Product not found' });
        return;
      }

      // Invalidate Redis cache to ensure fresh data is served
      try {
        await safeRedis.del('products:all');
      } catch (cacheError) {
        console.error('Failed to invalidate product cache:', cacheError);
        // Don't fail the request if cache invalidation fails
      }

      res.json({ message: 'Product deleted successfully' });
    } catch (error) {
      console.error('Error deleting product:', error);
      res.status(500).json({ error: 'Failed to delete product' });
    }
  }

  //// upload product image
async uploadProductImage(req: Request, res: Response): Promise<void> {
try {
  const { id } = req.params;
  const file = req.file;

  if (!file) {
    res.status(400).json({ error: 'No file uploaded' });
    return;
  }

  // Store only the filename
  const imageUrl = file.filename;

  const updatedProduct = await dataService.updateProductImage(id, imageUrl);

  if (!updatedProduct) {
    res.status(404).json({ error: 'Product not found' });
    return;
  }


  res.status(200).json({
    message: 'Image uploaded successfully',
    imageUrl,
    product: updatedProduct,
  });
} catch (error) {
  console.error(error);
  res.status(500).json({ error: 'Failed to upload product image' });
}
}

}

export default new ProductController();