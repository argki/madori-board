export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
        return
      }
      reject(new Error('ファイルを Data URL として読めませんでした'))
    }
    reader.onerror = () =>
      reject(reader.error ?? new Error('ファイルの読み込みに失敗しました'))
    reader.readAsDataURL(file)
  })
}
