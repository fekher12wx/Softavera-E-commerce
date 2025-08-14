  import { Request, Response } from 'express';
  import dataService from '../services/dataService';
  import { broadcast } from '../index';

  export class OrderController {
    // GET /api/orders
    async getAllOrders(req: Request, res: Response): Promise<void> {
      try {
        const orders = await dataService.getAllOrders();
        res.json(orders);
      } catch (error) {
        res.status(500).json({ error: 'Failed to fetch orders' });
      }
    }

    // GET /api/orders/:id
    async getOrderById(req: Request, res: Response): Promise<void> {
      try {
        const { id } = req.params;
        const order = await dataService.getOrderById(id);
        
        if (!order) {
          res.status(404).json({ error: 'Order not found' });
          return;
        }
        
        res.json(order);
      } catch (error) {
        res.status(500).json({ error: 'Failed to fetch order' });
      }
    }

    // GET /api/orders/user/:userId
    async getOrdersByUserId(req: Request, res: Response): Promise<void> {
      try {
        const { userId } = req.params;
        const orders = await dataService.getOrdersByUserId(userId);
        res.json(orders);
      } catch (error) {
        res.status(500).json({ error: 'Failed to fetch user orders' });
      }
    }

    // POST /api/orders
    async createOrder(req: Request, res: Response): Promise<void> {
      try {
        const { userId, items, total, shippingAddress, status } = req.body;
        
        if (!items || !total || !shippingAddress) {
          res.status(400).json({ error: 'Missing required fields' });
          return;
        }
        
        // If userId is present, validate that user exists
        if (userId) {
          const user = await dataService.getUserById(userId);
          if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
          }
        }
        
        // Validate products exist and calculate subtotal
        let subtotal = 0;
        const itemsWithFullProducts = [];
        for (const item of items) {
          const product = await dataService.getProductById(item.product.id);
          if (!product) {
            res.status(400).json({ error: `Product ${item.product.id} not found` });
            return;
          }
          subtotal += product.price * item.quantity;
          // Reconstruct item with full product data to match CartItem interface
          itemsWithFullProducts.push({
            product: {
              id: product.id,
              name: product.name,
              price: product.price,
              description: product.description,
              category: product.category,
              subcategory: product.subcategory,
              image: product.image,
              stock: product.stock,
              rating: product.rating,
              reviews: product.reviews,
              taxId: product.taxId,
              createdAt: product.createdAt,
              updatedAt: product.updatedAt
            },
            quantity: item.quantity
          });
        }
        
        // Get tax rate from settings
        let taxRate = 4;
        try {
          const taxSetting = await dataService.getTax();
          taxRate = Number(taxSetting);
        } catch (e) {
          // fallback to default 4%
        }
        const tax = subtotal * (taxRate / 100);
        const calculatedTotal = subtotal + tax;
        
        const order = await dataService.createOrder({
          userId,
          items: itemsWithFullProducts,
          total: calculatedTotal,
          status: status || 'pending',
          shippingAddress
        });
        broadcast(JSON.stringify({ type: 'order_created', order }));
        res.status(201).json(order);
      } catch (error) {
        console.error('Order creation error:', error);
        res.status(500).json({ error: 'Failed to create order' });
      }
    }
    //put 
  async updateOrderStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status || !['pending', 'processing', 'shipped', 'delivered','cancelled'].includes(status)) {
        res.status(400).json({ error: 'Invalid status' });
        return;
      }

      const updatedOrder = await dataService.updateOrderStatus(id, status);

      if (!updatedOrder) {
        res.status(404).json({ error: 'Order not found' });
        return;
      }
      broadcast(JSON.stringify({ type: 'order_status_updated', order: updatedOrder }));
      res.status(200).json(updatedOrder);
    } catch (error) {
      console.error('Error updating order status:', error);
      res.status(500).json({ error: 'Failed to update order status' });
    }
  }
  
  // PUT /api/orders/:id
  async updateOrder(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updates = req.body;
      const updatedOrder = await dataService.updateOrder(id, updates);

      if (!updatedOrder) {
        res.status(404).json({ error: 'Order not found' });
        return;
      }
      broadcast(JSON.stringify({ type: 'order_updated', order: updatedOrder }));
      res.status(200).json(updatedOrder);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update order' });
    }
  }
  

    // DELETE /api/orders/:id
    async deleteOrder(req: Request, res: Response): Promise<void> {
      try {
        const { id } = req.params;
        const deleted = await dataService.deleteOrder(id);
        
        if (!deleted) {
          res.status(404).json({ error: 'Order not found' });
          return;
        }
        broadcast(JSON.stringify({ type: 'order_deleted', orderId: id }));
        res.json({ message: 'Order deleted successfully' });
      } catch (error) {
        res.status(500).json({ error: 'Failed to delete order' });
      }
    }
  }

  export default new OrderController();