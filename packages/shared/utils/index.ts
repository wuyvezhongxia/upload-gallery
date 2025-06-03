export const checkedType = (target:any)=>{
    return Object.prototype.toString.call(target).slice(8,-1);
}
export const isObject = (value:any) => {
    return checkedType(value) === 'Object'
}