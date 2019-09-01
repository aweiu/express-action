import * as cookieParser from 'cookie-parser'
import * as express from 'express'
import * as logger from 'morgan'
import * as nocache from 'nocache'
import books from '@/routes/books'

const app = express()

app.use(logger('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.set('etag', false)
app.use(nocache())

app.use('/api/books', books)
export default app
