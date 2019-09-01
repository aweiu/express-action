import { Request, Response } from 'express'
import InjectError from '@/libs/action/src/InjectError'

// 限制返回值必须包含 data 或 msg
export type ResponseData =
  | {
      data: any
    }
  | { data?: any; msg: string; error?: boolean }

export function response(res: Response, obj: ResponseData) {
  const { data = null, msg = '', error = false } = obj as any
  res.send({ data, msg, error })
}

export function onError(e: Error, res: Response) {
  console.error(e)
  res.status(500).end()
}

// 实际你可能是从数据库中获取用户信息，这里只是模拟一下
function getUser(token: string): Promise<{ name: string }> {
  return new Promise((resolve) =>
    setTimeout(() => resolve({ name: 'Jack' }), 100),
  )
}

export async function injectUser(req: Request) {
  // 假设 token 存在于 header 中
  const token = req.get('token') || ''
  const user = await getUser(token)
  if (user) return { user } // action reject 必须返回一个对象，因为只有 key-value 这种形式才能作为注入数据
  // 主动抛出一个 InjectError, 插件会把构造参数交给 response 处理。你可以利用该特性来做鉴权
  throw new InjectError({
    msg: '请先登录',
    error: true,
  })
}
