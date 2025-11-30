type Props = {
  children: React.ReactNode;
}

export const Code = ({ children }: Props) => {
  return <code className="block whitespace-pre-wrap font-mono text-sm border-2 border-border rounded p-2">{children}</code>
}