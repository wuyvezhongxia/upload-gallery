import * as qiniu from 'qiniu-js'




const observable = qiniu.upload(file, key, token, putExtra, config)
const subscription = observable.subscribe(observer) // 上传开始