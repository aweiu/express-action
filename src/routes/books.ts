import { Router } from 'express'
import {
  getBooks,
  getBooksWithAuthentication,
  getBooksById,
  setBook,
} from '@/actions/books'
const router = Router()

router.get('/', getBooks)
router.get('/private', getBooksWithAuthentication)
router.get('/:id', getBooksById)
router.put('/:id', setBook)

export default router
