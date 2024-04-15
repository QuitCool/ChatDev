import { MidJourney } from 'midjourney-sdk'
const ins = new MidJourney({
  token: process.env.NEXT_PUBLIC_TOKEN,
  guild_id: process.env.NEXT_PUBLIC_GUILD_ID,
  channel_id: process.env.NEXT_PUBLIC_CHANNEL_ID,
  skipHeartbeat: true
})
;(async () => {
  await ins.init()
  // trigger image job
  const msg1 = await ins.api.imagine('apple --q 5', ({ url, progress }) => {
    console(url, progress)
  })
  // trigger button job
  const msg2 = await ins.api.action(
    'msgId',
    'customId',
    'msgFlags',
    ({ url, progress }) => {
      console(url, progress)
    }
  )
  // trigger remix job
  const msg3 = await ins.api.remixSubmit(
    'modalMsgId',
    'customId',
    'components',
    ({ url, progress }) => {
      console(url, progress)
    }
  )
  // trigger vary(region) job
  const msg4 = await ins.api.varyRegion(
    'customId',
    'prompt',
    'mask',
    ({ url, progress }) => {
      console(url, progress)
    }
  )
})()