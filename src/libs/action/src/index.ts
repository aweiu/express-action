import { Request, Response } from 'express'
import InjectError from './InjectError'

type AnyFunction<T = any> = (...args: any[]) => T
type DataOrPromiseData<T> = T | Promise<T>
type UnionToIntersection<U> = (U extends any
  ? (k: U) => void
  : never) extends ((k: infer I) => void)
  ? I
  : never
type Prettify<T> = [T] extends [infer U] ? { [K in keyof U]: U[K] } : never
type RequestHandler = (req: Request, res: Response) => Promise<any>
type RequestKey = (req: Request) => string | undefined
type PromiseReturnType<T extends AnyFunction> = ReturnType<T> extends Promise<
  infer R
>
  ? R
  : ReturnType<T>

interface Option<Injects, ResponseData> {
  injects?: Injects
  shareRequestKey?: RequestKey
  uniqueRequestOption?: {
    key: RequestKey
    errorData: ResponseData
  }
}

interface CallBackParameter {
  req: Request
}

export default function action<ResponseData>({
  response,
  onError,
}: {
  response: (res: Response, data: ResponseData) => any
  onError: (e: Error, res: Response) => any
}) {
  function makeAction<
    T extends AnyFunction,
    Data extends Prettify<
      CallBackParameter & UnionToIntersection<PromiseReturnType<T>>
    >
  >(
    option: Option<T[], ResponseData>,
    callback: (data: Data) => DataOrPromiseData<ResponseData>,
  ): RequestHandler
  function makeAction(
    callback: (data: CallBackParameter) => DataOrPromiseData<ResponseData>,
  ): RequestHandler
  function makeAction<Data>(...args: any[]) {
    const {
      injects = [],
      shareRequestKey,
      uniqueRequestOption,
    }: Option<any[], ResponseData> =
      typeof args[0] === 'function' ? {} : args[0]
    const callback = typeof args[0] === 'function' ? args[0] : args[1]

    async function getInjectData(req: Request) {
      const injectData = {}
      await Promise.all(
        injects.map(async (inject) => {
          const data = await inject(req)
          Object.assign(injectData, data)
        }),
      )
      return injectData
    }

    async function getResponseData(
      req: Request,
      callback: (data: Data) => DataOrPromiseData<ResponseData>,
    ): Promise<ResponseData> {
      try {
        const injectData: any = await getInjectData(req)
        return callback({ req, ...injectData })
      } catch (e) {
        if (e instanceof InjectError) return e.data
        else throw e
      }
    }

    const taskCache = new Map<string, Promise<any>>()
    const runCacheTask = async (req: Request, key: string) => {
      const data = await getResponseData(req, callback)
      taskCache.delete(key)
      return data
    }

    return async (req: Request, res: Response) => {
      try {
        let responseData
        const requestKey =
          shareRequestKey || (uniqueRequestOption && uniqueRequestOption.key)
        if (requestKey) {
          const key = requestKey(req)
          if (key) {
            if (uniqueRequestOption && taskCache.has(key)) {
              return response(res, uniqueRequestOption.errorData)
            }
            if (!taskCache.has(key)) taskCache.set(key, runCacheTask(req, key))
            responseData = await taskCache.get(key)
          }
        }
        if (!responseData) {
          responseData = await getResponseData(req, callback)
        }
        response(res, responseData)
      } catch (e) {
        onError(e, res)
      }
    }
  }
  return makeAction
}

export { InjectError }
