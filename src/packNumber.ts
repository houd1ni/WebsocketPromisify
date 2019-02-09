
const abc = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
const ln = abc.length-1

export default (n: number): string => {
  const s: string[] = []
  while(n >= 1) {
    s.push(abc[n%(ln+1)])
    n = (n/ln)|0
  }
  return s.join('')
}