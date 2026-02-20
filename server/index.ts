import express from 'express';
import cors from 'cors';
import { scrapeCarListing } from './scraper';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.post('/api/scrape', async (req, res) => {
  const { url } = req.body;
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    const data = await scrapeCarListing(url);
    res.json(data);
  } catch (err: any) {
    console.error('Scrape error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to scrape' });
  }
});

app.listen(PORT, () => {
  console.log(`Scraping server running on http://localhost:${PORT}`);
});
