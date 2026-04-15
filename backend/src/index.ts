import { env } from './config/env.js'
import { createApp } from './app.js'

const app = createApp()
const port = parseInt(env.PORT, 10)

app.listen(port, () => {
  console.log(`✅  SPIN Coach backend running on port ${port}`)
  console.log(`   Health: http://localhost:${port}/api/health`)
  console.log(`   ENV: ${env.NODE_ENV}`)
})
