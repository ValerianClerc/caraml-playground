import { useCallback, useMemo } from "react"
import { codeSamples } from "../codeSamples"

type Props = {
  onExampleSelected: (code: string) => void;
}

export const ExampleSelector = ({ onExampleSelected }: Props) => {
  const onExampleChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedExample = codeSamples.find(sample => sample.name === e.target.value);
    if (selectedExample) {
      onExampleSelected(selectedExample.code);
    }
  }, [onExampleSelected]);
  const examplesOptions = useMemo(() => {

    return codeSamples.map((sample, index) => (
      <option key={index} value={sample.name}>
        {sample.name}
      </option>
    ))
  }, [])

  return (
    <select onChange={onExampleChange}>
      {examplesOptions}
    </select>
  )
}