type NoInfer<T> = [T][T extends any ? 0 : never]

export default class InjectError<ResponseData = void> {
  data: ResponseData

  constructor(
    data: NoInfer<ResponseData> &
      (ResponseData extends void
        ? 'You have to pass in your ResponseData generic'
        : {}),
  ) {
    this.data = data
  }
}
