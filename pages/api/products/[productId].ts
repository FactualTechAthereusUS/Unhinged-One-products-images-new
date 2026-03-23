import { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'

const API_BASE = 'https://api.printify.com/v1'
const TOKEN = process.env.PRINTIFY_TOKEN

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { productId, shopId } = req.query

  if (!TOKEN) {
    return res.status(500).json({ error: 'PRINTIFY_TOKEN is not configured on the server' })
  }

  if (!productId || !shopId) {
    return res.status(400).json({ error: 'Product ID and Shop ID are required' })
  }

  try {
    const response = await axios.get(`${API_BASE}/shops/${shopId}/products/${productId}.json`, {
      headers: { 
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      },
    })
    
    res.status(200).json(response.data)
  } catch (error) {
    console.error('Failed to fetch product:', error)
    res.status(500).json({ error: 'Failed to fetch product' })
  }
} 