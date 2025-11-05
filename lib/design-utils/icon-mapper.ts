/**
 * Semantic mapping of keywords to Heroicons
 * Maps common concepts to appropriate icon names
 */
export const ICON_SEMANTIC_MAP: Record<string, string> = {
  // Growth & Progress
  growth: 'RocketLaunchIcon',
  progress: 'ChartBarIcon',
  success: 'CheckCircleIcon',
  achievement: 'TrophyIcon',
  target: 'FlagIcon',
  
  // Security & Protection
  security: 'ShieldCheckIcon',
  protection: 'LockClosedIcon',
  safe: 'ShieldExclamationIcon',
  privacy: 'EyeSlashIcon',
  
  // Team & People
  team: 'UserGroupIcon',
  people: 'UsersIcon',
  user: 'UserIcon',
  profile: 'UserCircleIcon',
  community: 'UserGroupIcon',
  
  // Love & Emotion
  love: 'HeartIcon',
  favorite: 'HeartIcon',
  like: 'HandThumbUpIcon',
  happy: 'FaceSmileIcon',
  celebrate: 'SparklesIcon',
  
  // Data & Analytics
  data: 'ChartBarIcon',
  analytics: 'ChartPieIcon',
  graph: 'PresentationChartLineIcon',
  report: 'DocumentChartBarIcon',
  stats: 'ChartBarSquareIcon',
  
  // Light & Energy
  light: 'SunIcon',
  bright: 'BoltIcon',
  energy: 'BoltIcon',
  power: 'FireIcon',
  spark: 'SparklesIcon',
  
  // Communication
  message: 'ChatBubbleLeftIcon',
  chat: 'ChatBubbleOvalLeftEllipsisIcon',
  email: 'EnvelopeIcon',
  notification: 'BellIcon',
  announcement: 'MegaphoneIcon',
  
  // Time & Calendar
  time: 'ClockIcon',
  calendar: 'CalendarIcon',
  schedule: 'CalendarDaysIcon',
  deadline: 'ClockIcon',
  
  // Location & Travel
  location: 'MapPinIcon',
  map: 'MapIcon',
  travel: 'GlobeAltIcon',
  world: 'GlobeAmericasIcon',
  
  // Money & Finance
  money: 'CurrencyDollarIcon',
  finance: 'BanknotesIcon',
  payment: 'CreditCardIcon',
  price: 'ReceiptPercentIcon',
  
  // Technology
  tech: 'ComputerDesktopIcon',
  mobile: 'DevicePhoneMobileIcon',
  code: 'CodeBracketIcon',
  api: 'CommandLineIcon',
  cloud: 'CloudIcon',
  
  // Action & Movement
  action: 'PlayIcon',
  start: 'ArrowRightIcon',
  go: 'ArrowRightCircleIcon',
  forward: 'ForwardIcon',
  back: 'BackwardIcon',
  
  // Media
  photo: 'PhotoIcon',
  image: 'PhotoIcon',
  video: 'VideoCameraIcon',
  music: 'MusicalNoteIcon',
  
  // Education
  learn: 'AcademicCapIcon',
  education: 'BookOpenIcon',
  study: 'BookmarkIcon',
  knowledge: 'LightBulbIcon',
  
  // Shopping
  shop: 'ShoppingBagIcon',
  cart: 'ShoppingCartIcon',
  store: 'BuildingStorefrontIcon',
  
  // Settings & Tools
  settings: 'Cog6ToothIcon',
  tools: 'WrenchScrewdriverIcon',
  edit: 'PencilIcon',
  delete: 'TrashIcon',
  add: 'PlusCircleIcon',
  
  // Status
  check: 'CheckIcon',
  error: 'ExclamationTriangleIcon',
  warning: 'ExclamationCircleIcon',
  info: 'InformationCircleIcon',
  
  // Nature
  nature: 'SparklesIcon',
  tree: 'GlobeAltIcon',
  leaf: 'SparklesIcon',
  flower: 'SparklesIcon',
  
  // Default fallback
  default: 'StarIcon',
}

/**
 * Get icon name from keyword using semantic mapping
 */
export function getIconForKeyword(keyword: string): string {
  const normalized = keyword.toLowerCase().trim()
  return ICON_SEMANTIC_MAP[normalized] || ICON_SEMANTIC_MAP.default
}

/**
 * Get multiple icons from array of keywords
 */
export function getIconsForKeywords(keywords: string[]): string[] {
  return keywords.map(getIconForKeyword)
}

/**
 * Available icon variants
 */
export type IconVariant = 'outline' | 'solid'

export interface IconConfig {
  name: string
  variant: IconVariant
  color: string
  size: number
  position: { x: number; y: number }
}
