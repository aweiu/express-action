export default class InjectError<ResponseData> extends Error {
  data: ResponseData

  constructor(data: ResponseData) {
    super()
    this.data = data as any
  }
}
