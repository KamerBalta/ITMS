// #12: Tum uygulamada gorev linkleri BU fonksiyon uzerinden uretilmeli -- boylece
// URL semasi ileride tekrar degisirse (orn. /browse yerine baska bir yapi) tek yerden guncellenir.
export function taskDetailUrl(issueKey: string): string {
    return `/browse/${issueKey}`;
}