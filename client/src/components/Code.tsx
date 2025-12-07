type Props = {
  children: React.ReactNode;
  disableBorder?: boolean;
}

export const Code = ({ children, disableBorder }: Props) => {
  return <code className={`block whitespace-pre-wrap font-mono text-sm ${disableBorder ? '' : 'border-2 border-border'} rounded p-2`}>{children}</code>
}