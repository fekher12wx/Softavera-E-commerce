import { Request, Response } from 'express';
import dataService from '../services/dataService';
import { AuthRequest } from '../middleware/auth';

class SettingsController {
  async getActivePaymentMethod(req: Request, res: Response) {
    try {
      const method = await dataService.getActivePaymentMethod();
      res.json({ activePaymentMethod: method });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get active payment method' });
    }
  }

  async setActivePaymentMethod(req: AuthRequest, res: Response) {
    try {
      // Only admin can change
      if (!req.user || String(req.user.role).toUpperCase() !== 'ADMIN') {
        return res.status(403).json({ error: 'Forbidden: Admins only' });
      }
      const { method } = req.body;
      if (!['adyen', 'paymee', 'konnect'].includes(method)) {
        return res.status(400).json({ error: 'Invalid payment method' });
      }
      await dataService.setActivePaymentMethod(method);
      return res.json({ message: 'Payment method updated', activePaymentMethod: method });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to set active payment method' });
    }
  }

  async getCurrency(req: Request, res: Response) {
    try {
      const currency = await dataService.getCurrency();
      res.json({ currency });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get currency' });
    }
  }

  async setCurrency(req: AuthRequest, res: Response) {
    try {
      if (!req.user || String(req.user.role).toUpperCase() !== 'ADMIN') {
        return res.status(403).json({ error: 'Forbidden: Admins only' });
      }
      const { currency } = req.body;
      if (!currency || typeof currency !== 'string') {
        return res.status(400).json({ error: 'Invalid currency' });
      }
      await dataService.setCurrency(currency);
      return res.json({ message: 'Currency updated', currency });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to set currency' });
    }
  }

  async getTax(req: Request, res: Response) {
    try {
      const tax = await dataService.getTax();
      res.json({ tax });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get tax' });
    }
  }

  async setTax(req: AuthRequest, res: Response) {
    try {
      if (!req.user || String(req.user.role).toUpperCase() !== 'ADMIN') {
        return res.status(403).json({ error: 'Forbidden: Admins only' });
      }
      const { tax } = req.body;
      if (tax === undefined || isNaN(Number(tax))) {
        return res.status(400).json({ error: 'Invalid tax value' });
      }
      await dataService.setTax(String(tax));
      return res.json({ message: 'Tax updated', tax });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to set tax' });
    }
  }

  async getTaxes(req: Request, res: Response) {
    try {
      const taxes = await dataService.getTaxes();
      res.json({ taxes });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get taxes' });
    }
  }

  async getActiveTaxes(req: Request, res: Response) {
    try {
      const taxes = await dataService.getActiveTaxes();
      res.json({ taxes });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get active taxes' });
    }
  }
}

export default new SettingsController();
