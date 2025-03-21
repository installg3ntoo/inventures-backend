require('dotenv')

const koa = require('koa');
const Router = require('koa-router');
const cors = require('@koa/cors'); // Middleware para habilitar CORS
const bodyParser = require('koa-bodyparser'); // Middleware para analizar el cuerpo de las solicitudes POST
const KoaLogger = require('koa-logger'); // Middleware para ver los logs
const { MongoClient } = require('mongodb');

const { nanoid } = require('nanoid');

const {MONGODB_URL , MONGODB_DB, CORS_ORIGIN, API_KEY} = process.env;
const PORT = process.env.PORT || 3000;

const app = new koa();
const router = new Router();

const url = MONGODB_URL;
const dbName = MONGODB_DB;
const client = new MongoClient(url, { useUnifiedTopology: true });
let dbConnection; // Variable para almacenar la conexión a la base de datos

async function connect () {
    if (dbConnection) {
      return dbConnection
    }
    console.log('Connecting to database...')
    try {
      await client.connect()
      console.log('Connected to database')
      dbConnection = client.db(dbName)
      await dbConnection.collection('urls').createIndex({ shortUrl: 1 }, { unique: true })
      return dbConnection
    } catch (err) {
      console.error('Error trying to connect to database:', err)
      throw err
    }
  }


// Middleware para habilitar CORS
app.use(cors({
        origin: CORS_ORIGIN,
        allowMethods: ['GET', 'POST'],
        allowHeaders: ['Content-Type', 'Authorization', 'api-key']
}));

// Middleware para analizar el cuerpo de las solicitudes POST
app.use(bodyParser());


// Middleware para validar el API Key
app.use(async (ctx, next) => {
    const apiKey = ctx.request.headers['api-key'];
    if (apiKey !== API_KEY) {
        ctx.response.status = 401;
        ctx.response.body = { error: 'Unauthorized' };
        return;
    }
    await next();
});

/*
router.get('/api', async (ctx) => {
    ctx.body = { message: 'Hello, World! 2' };
});*/


router.post('/newurl', async (ctx) => {
    try{

        const { url, prefix } = ctx.request.body;

        // if URL is not valid
        if (!URL.canParse(url)) {
            ctx.response.status = 400;
            ctx.response.body = { error: 'Invalid URL' };
            return;
        }

        // if prefix is longer than 7 chars
        if (prefix && prefix.length > 7) {
            ctx.response.status = 400;
            ctx.response.body = { error: 'Prefix too long' };
            return;
        }

        const db = await connect();
        const urls = db.collection('urls');

        const shortUrl = prefix ? `${prefix}-${nanoid(9)}` : nanoid(9);

        const currentDate = new Date();

        const expiresAt = new Date(new Date(currentDate).setDate(currentDate.getDate() + 3));

        const result = await urls.insertOne({ 
            longUrl: url,
            shortUrl: shortUrl,
            createdAt: currentDate,
            expiresAt: expiresAt,
            clicks: 0

        });
        ctx.response.body = { shortUrl, expiresAt };
    } catch (error) {
        console.error('Error trying to create short URL:', error)
        ctx.response.status = 500
        ctx.response.body = { error: 'Internal server error' }
    }
});

router.get('/:shortUrl', async (ctx) => {
    try {
        const { shortUrl } = ctx.params;
        const db = await connect();
        const urls = db.collection('urls');
        const result = await urls.findOne({ shortUrl });
        if (!result) {
            ctx.response.status = 404;
            ctx.response.body = { error: 'Not found' };
            return;
        }

        if (result.expiresAt < new Date()) {
            ctx.response.status = 410;
            ctx.response.body = { error: 'Expired' };
            return;
        }

        const { longUrl } = result;

        await urls.updateOne({ shortUrl }, { $inc: { clicks: 1 } });
        
        ctx.response.body  = { longUrl };
        //ctx.response.redirect(longUrl);
    } catch (error) {
        console.error('Error trying to redirect to long URL:', error)
        ctx.response.status = 500
        ctx.response.body = { error: 'Internal server error' }
    }
});

router.get('/:shortUrl/data', async (ctx) => {
    try {
        const { shortUrl } = ctx.params;
        const db = await connect();
        const urls = db.collection('urls');
        const result = await urls.findOne({ shortUrl });
        if (!result) {
            ctx.response.status = 404;
            ctx.response.body = { error: 'Not found' };
            return;
        }
        ctx.response.body = result;
    } catch (error) {
        console.error('Error trying to get URL data:', error)
        ctx.response.status = 500
        ctx.response.body = { error: 'Internal server error' }
    }
});


// Logs requests from the server
app.use(KoaLogger());

app.use(router.routes()).use(router.allowedMethods());
    
app.listen(PORT, () => {
    console.log(`Server listening on port: ${PORT}`);
});