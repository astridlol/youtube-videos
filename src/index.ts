import { Hono } from 'hono'
import getVideos from "./utils/getVideos";
import checkForShort from "./utils/checkShorts";

const app = new Hono()

app.get('/', (c) => {
  return c.json({
    made_by: 'Astrid (https://astrid.sh/)',
    github_repo: 'https://github.com/flowergardn/yt.everly.sh',
  })
})

app.get('/short/:id', async (c) => {
  const isShort = await checkForShort(c.req.param('id'))
  return c.json({
    id: c.req.param('id'),
    is_short: isShort,
  })
})

app.get('/:id', async (c) => {
  const channelId = c.req.param('id')

  if(channelId.length < 24 || !channelId.includes("UC")) {
    return c.json({
      error: `Invalid channel ID provided!`,
    }, 400)
  }

  try {
    const videos = await getVideos(channelId)
    return c.json(videos)
  } catch (error) {
    console.error(error)
    return c.json({
      error: `An error occurred while fetching the videos!`,
    }, 500)
  }
})

app.all("*", (c) => {
  return c.text('Not Found', 404)
})

export default app
