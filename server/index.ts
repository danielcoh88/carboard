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

app.post('/api/download-image', async (req, res) => {
  const { url } = req.body;
  if (!url || typeof url !== 'string') {
    return res.status(400).send('URL is required');
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'image/*,*/*',
      },
    });
    if (!response.ok) {
      return res.status(response.status).send(`Failed to fetch image: ${response.statusText}`);
    }
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    if (!contentType.startsWith('image/')) {
      return res.status(400).send('הלינק לא מצביע על תמונה');
    }
    const buffer = await response.arrayBuffer();
    const data = Buffer.from(buffer).toString('base64');
    res.json({ data, contentType });
  } catch (err: any) {
    console.error('Image download error:', err.message);
    res.status(500).send(err.message || 'Failed to download image');
  }
});

app.listen(PORT, () => {
  console.log(`Scraping server running on http://localhost:${PORT}`);
});
