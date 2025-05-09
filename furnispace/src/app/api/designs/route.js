import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

async function connectToDatabase() {
  try {
    await client.connect();
    return client.db('furnispace').collection('designs');
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw new Error('Database connection failed');
  }
}

export async function GET() {
  try {
    const collection = await connectToDatabase();
    const design = await collection.findOne({ id: 'design-3d-data' }); // Simple ID for demo purposes
    return new Response(JSON.stringify(design ? design.data : null), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch design' }), { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const collection = await connectToDatabase();
    await collection.updateOne(
      { id: 'design-3d-data' },
      { $set: { id: 'design-3d-data', data } },
      { upsert: true }
    );
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to save design' }), { status: 500 });
  }
}