import SvgIcon, { type SvgIconProps } from "@mui/material/SvgIcon"

const paths = {
  arrowUpRight: "M6 18 18 6M6 6h12v12",
  arrowRight: "M4 12h16m-6-6 6 6-6 6",
  play: "m9 5 11 7-11 7V5Z",
  youtube: "M22 12c0 3-.4 5.5-1.2 6.2-.8.8-5.4.8-8.8.8s-8 0-8.8-.8C2.4 17.5 2 15 2 12s.4-5.5 1.2-6.2C4 5 8.6 5 12 5s8 0 8.8.8C21.6 6.5 22 9 22 12Zm-12-3 5 3-5 3V9Z",
  search: "M20 20l-5-5M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z",
  account: "M20 21a8 8 0 0 0-16 0M12 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z",
  bag: "M5 7h14l1 14H4L5 7ZM8 8V6a4 4 0 0 1 8 0v2",
  menu: "M4 7h16M4 12h16M4 17h16",
  close: "m6 6 12 12M6 18 18 6",
  plus: "M5 12h14M12 5v14",
  minus: "M5 12h14",
  chevronDown: "m6 9 6 6 6-6",
  document: "M14 3H5v18h14V8l-5-5ZM14 3v5h5M8 12h8M8 16h6",
  shield: "m12 2 8 3v6c0 5-4 8-8 11-4-3-8-6-8-11V5l8-3Zm-4 10 3 3 5-6",
  flask: "M9 3h6M10 3v6L4 19a1.3 1.3 0 0 0 1 2h14a1.3 1.3 0 0 0 1-2L14 9V3M7 15h10",
  support: "M4 13v-2a8 8 0 0 1 16 0v5a4 4 0 0 1-4 4h-3M4 11H2v6h4v-6H4Zm16 0h2v6h-4v-6h2ZM10 20h3",
  globe: "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM3 12h18M12 3c5 5 5 13 0 18-5-5-5-13 0-18Z",
  truck: "M2 5h12v12H2V5Zm12 5h4l4 4v3h-8M6 20a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Zm12 0a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
  lock: "M5 10h14v11H5V10Zm3 0V7a4 4 0 0 1 8 0v3M12 14v3",
  bank: "m2 8 10-6 10 6H2Zm2 3v7m5-7v7m6-7v7m5-7v7M2 21h20",
  card: "M3 6h18v12H3V6Zm0 4h18M7 15h3",
  wallet: "M4 7h15v12H4V7Zm0 0 11-3v3M15 13h2",
  coin: "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.5 8h3.5a2 2 0 0 1 0 4H9.5h4a2 2 0 0 1 0 4H9.5V8Zm1.5-2v2m0 8v2",
  eye: "M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  eyeOff: "M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3 3.8M6.6 6.6C3.8 8.4 2 12 2 12s3.6 7 10 7c1.8 0 3.4-.5 4.7-1.3M9.9 9.9a3 3 0 0 0 4.2 4.2",
  check: "m5 12 4 4L19 6",
  checkCircle: "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM7 12l3 3 7-7",
  trash: "M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7",
  download: "M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5",
  mail: "M3 5h18v14H3V5Zm0 1 9 7 9-7",
  clock: "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM12 7v5l3 2",
  send: "m3 3 18 8-8 3-3 7L3 3Zm0 0 10 11",
  package: "m12 2 9 5v10l-9 5-9-5V7l9-5Zm-9 5 9 5 9-5M12 12v10M7 4.8l9 5",
  sliders: "M4 6h5m4 0h7M4 12h9m4 0h3M4 18h3m4 0h9M9 3v6m4 0v6m-6 0v6",
  snowflake: "M12 2v20M3.3 7l17.4 10M3.3 17 20.7 7M9 4l3 3 3-3M9 20l3-3 3 3M3 10l4-1-1-4M21 14l-4 1 1 4M3 14l4 1-1 4M21 10l-4-1 1-4",
  leaf: "M20 3C8 2 2 8 5 16s15 7 15-13ZM5 20 17 7M8 13l5 1",
  mountain: "m2 19 7-10 4 5 4-9 5 14H2Zm13-9 2 2 2-2M7 12l2 2 2-2",
  molecule: "m7 6 10 4-5 9M7 6 3 15l9 4M10 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm10 4a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM6 15a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm9 4a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z",
} as const

export type IconName = keyof typeof paths
export default function Icon({ name, ...props }: SvgIconProps & { name: IconName }) {
  return <SvgIcon viewBox="0 0 24 24" aria-hidden="true" {...props}>
    <path d={paths[name]} fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </SvgIcon>
}

const named = (name: IconName) => function LineIcon(props: SvgIconProps) { return <Icon {...props} name={name} /> }
export const ArrowUpRightIcon = named("arrowUpRight")
export const ArrowRightIcon = named("arrowRight")
export const SearchIcon = named("search")
export const AccountIcon = named("account")
export const BagIcon = named("bag")
export const MenuIcon = named("menu")
export const CloseIcon = named("close")
export const PlusIcon = named("plus")
export const MinusIcon = named("minus")
export const ChevronDownIcon = named("chevronDown")
export const DocumentIcon = named("document")
export const ShieldIcon = named("shield")
export const FlaskIcon = named("flask")
export const SupportIcon = named("support")
export const GlobeIcon = named("globe")
export const TruckIcon = named("truck")
export const LockIcon = named("lock")
export const BankIcon = named("bank")
export const CheckIcon = named("check")
export const CheckCircleIcon = named("checkCircle")
export const TrashIcon = named("trash")
export const DownloadIcon = named("download")
export const MailIcon = named("mail")
export const ClockIcon = named("clock")
export const SendIcon = named("send")
export const PackageIcon = named("package")
export const SlidersIcon = named("sliders")
