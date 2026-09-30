export function maskCPF(v: string) {
  if (!v) return ''
  let val = v.replace(/\D/g, '')
  if (val.length > 11) val = val.slice(0, 11)
  return val
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

export function maskRG(v: string) {
  if (!v) return ''
  let val = v.replace(/[^0-9a-zA-Z]/g, '').toUpperCase()
  if (val.length > 9) val = val.slice(0, 9)
  if (val.length <= 2) return val
  if (val.length <= 5) return val.replace(/^(\w{2})(\w+)/, '$1.$2')
  if (val.length <= 8) return val.replace(/^(\w{2})(\w{3})(\w+)/, '$1.$2.$3')
  return val.replace(/^(\w{2})(\w{3})(\w{3})(\w+)/, '$1.$2.$3-$4')
}


export function maskPhone(v: string) {
  if (!v) return ''
  let val = v.replace(/\D/g, '')
  if (val.length > 11) val = val.slice(0, 11)
  if (val.length <= 10) {
    return val.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2')
  }
  return val.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2')
}

export function maskCEP(v: string) {
  if (!v) return ''
  let val = v.replace(/\D/g, '')
  if (val.length > 8) val = val.slice(0, 8)
  return val.replace(/(\d{5})(\d)/, '$1-$2')
}

export function maskEmail(v: string) {
  if (!v) return ''
  return v.replace(/\s/g, '').toLowerCase()
}

export function isValidEmail(email: string): boolean {
  if (!email) return false
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

export function isValidCPF(cpf: string): boolean {
  if (!cpf) return false
  const clean = cpf.replace(/\D/g, '')
  if (clean.length !== 11 || /^(\d)\1{10}$/.test(clean)) return false
  let sum = 0
  let remainder: number
  for (let i = 1; i <= 9; i++) sum += parseInt(clean.substring(i - 1, i)) * (11 - i)
  remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(clean.substring(9, 10))) return false
  sum = 0
  for (let i = 1; i <= 10; i++) sum += parseInt(clean.substring(i - 1, i)) * (12 - i)
  remainder = (sum * 10) % 11
  if (remainder === 10 || remainder === 11) remainder = 0
  if (remainder !== parseInt(clean.substring(10, 11))) return false
  return true
}

export function isValidPhone(phone: string): boolean {
  if (!phone) return false
  const clean = phone.replace(/\D/g, '')
  return clean.length >= 10 && clean.length <= 11
}

/**
 * Formata e valida a digitação de data no formato DD/MM/AAAA.
 * - Limita os 2 primeiros dígitos (dia) a 31
 * - Limita os 2 dígitos seguintes (mês) a 12
 * - O ano aceita até 4 dígitos numéricos
 */
export function maskDate(v: string): string {
  if (!v) return ''
  const rawDigits = v.replace(/\D/g, '')
  if (!rawDigits) return ''

  let dayStr = ''
  let monthStr = ''
  let yearStr = ''

  let idx = 0

  // 1. Processa o Dia (máx 31)
  if (rawDigits.length > idx) {
    const firstDigit = parseInt(rawDigits[idx], 10)
    if (rawDigits.length === 1 && firstDigit > 3) {
      // Se digitou 4-9 no primeiro digito, auto-pad com 0
      dayStr = `0${firstDigit}`
      idx = 1
    } else if (rawDigits.length >= idx + 2) {
      let dayVal = parseInt(rawDigits.substring(idx, idx + 2), 10)
      if (dayVal > 31) dayVal = 31
      if (dayVal === 0) dayVal = 1
      dayStr = String(dayVal).padStart(2, '0')
      idx += 2
    } else {
      dayStr = rawDigits.substring(idx)
      idx = rawDigits.length
    }
  }

  // 2. Processa o Mês (máx 12)
  if (rawDigits.length > idx) {
    const firstDigitMonth = parseInt(rawDigits[idx], 10)
    if (rawDigits.length === idx + 1 && firstDigitMonth > 1) {
      monthStr = `0${firstDigitMonth}`
      idx += 1
    } else if (rawDigits.length >= idx + 2) {
      let monthVal = parseInt(rawDigits.substring(idx, idx + 2), 10)
      if (monthVal > 12) monthVal = 12
      if (monthVal === 0) monthVal = 1
      monthStr = String(monthVal).padStart(2, '0')
      idx += 2
    } else {
      monthStr = rawDigits.substring(idx)
      idx = rawDigits.length
    }
  }

  // 3. Processa o Ano (máx 4 dígitos)
  if (rawDigits.length > idx) {
    yearStr = rawDigits.substring(idx, idx + 4)
  }

  // Montagem formatada
  if (yearStr) {
    return `${dayStr}/${monthStr}/${yearStr}`
  }
  if (monthStr) {
    return `${dayStr}/${monthStr}`
  }
  return dayStr
}

/**
 * Valida se uma string representa uma data completa e válida (DD/MM/AAAA)
 * com ano de exatamente 4 dígitos e limites de dias do mês respeitados.
 */
export function isValidDate(dateStr: string): boolean {
  if (!dateStr) return false
  const parts = dateStr.trim().split('/')
  if (parts.length !== 3) return false

  const [dStr, mStr, yStr] = parts
  if (dStr.length !== 2 || mStr.length !== 2 || yStr.length !== 4) return false

  const day = parseInt(dStr, 10)
  const month = parseInt(mStr, 10)
  const year = parseInt(yStr, 10)

  if (isNaN(day) || isNaN(month) || isNaN(year)) return false
  if (month < 1 || month > 12) return false
  if (year < 1900 || year > 2100) return false

  const maxDays = new Date(year, month, 0).getDate()
  if (day < 1 || day > maxDays) return false

  return true
}

