import makeAction from '@/libs/makeAction'
import { injectUser } from '@/libs/makeAction/option'

const books = [{ id: '1', name: 'book1' }, { id: '2', name: 'book2' }]
function getBooksByUser(userName: string) {
  return new Promise((resolve) =>
    setTimeout(() => resolve({ data: books }), 100),
  )
}

// 一个最基本的例子
export const getBooks = makeAction(() => ({ data: books }))

// 获取需要授权的数据
export const getBooksWithAuthentication = makeAction(
  {
    injects: [injectUser],
  },
  // 上面传入的 injects 返回的数据都会被注入到下面
  // 如果注入失败，比如这个例子的失败场景就是获取不到用户信息，那么请求会返回 injectUser 抛出的 InjectError
  async ({ user }) => {
    const books = await getBooksByUser(user.name)
    return { data: books }
  },
)

// 共享对同一个资源的重复请求
export const getBooksById = makeAction(
  {
    // 如果发现有相同的 req.params.id 正在请求中，则会复用之后的请求，也就是说下面的 handle 只会执行一次，这些相同的请求将得到一个相同的结果
    shareRequestKey: (req) => req.params.id,
  },
  ({ req }) => {
    // 当有重复请求发生的时候，这里的代码只会被执行一次
    const book = books.find((book) => book.id === req.params.id)
    return { data: book }
  },
)

// 限制对同一个资源的重复请求
export const setBook = makeAction(
  {
    uniqueRequestOption: {
      // 如果发现有相同的 req.params.id 正在请求中，则会拦截掉后面的并返回 errorData
      key: (req) => req.params.id,
      errorData: { msg: '请不要重复提交', error: true },
    },
  },
  ({ req }) => {
    const book = books.find((book) => book.id === req.params.id)
    if (book) book.name = '23333'
    return { data: book, msg: '修改成功' }
  },
)
