const fs = require('fs')
const path = require('path')
const Koa = require('koa')
const koaStatic = require('koa-static')
const cookie = require('koa-cookie').default
const mount = require('koa-mount')
const favicon = require('koa-favicon')
const resolve = file => path.resolve(__dirname, file)
const PORT = process.env.NODE_PORT ? parseInt(process.env.NODE_PORT) : 8080

const template = fs.readFileSync(resolve('./index.template.html'), 'utf-8')
const { createBundleRenderer } = require('vue-server-renderer')
const bundle = require('../vue-ssr-server-bundle.json')
const clientManifest = require('../vue-ssr-client-manifest.json')

const app = new Koa()
app.use(cookie())

const renderer = createBundleRenderer(
  bundle,
  {
    clientManifest,
    template,
    runInNewContext: false
  }
)

const handleError = (ctx, err) => {
  if (err.url) {
    ctx.status = err.code || 302
    ctx.redirect(err.url)
  } else if (err.code === 404) {
    ctx.status = 404
    ctx.body = '404 | Page Not Found'
  } else {
    // Render Error Page or Redirect
    ctx.status = 500
    ctx.body = '500 | Internal Server Error'
  }
  console.error(`error during render : url=${ctx.url} err=`, err)
}

async function ssrRequestHandle (ctx, next) {
  ctx.set('Content-Type', 'text/html')
  const context = {
    title: 'SSR PAGE TITLE',
    description: '',
    keywords: '',
    ssrHeadAddInfo: '',
    url: ctx.url,
    cookies: ctx.cookie || {},
    userAgent: ctx.header['user-agent']
  }

  try {
    console.log('Render ', ctx.url)
    ctx.body = await renderer.renderToString(context)
  } catch (err) {
    handleError(ctx, err)
  }
}

app.use(mount('/static', koaStatic(resolve('../static'))))
app.use(favicon(resolve('../favicon.ico')))

app.use(async (ctx, next) => {
  await ssrRequestHandle(ctx, next)
})
const server = app
  .listen(PORT)
  .on('listening', () => {
    console.log(`server started at localhost:${PORT}`)
  })
  .on('error', err => {
    console.log('---server error---', err)
  })
