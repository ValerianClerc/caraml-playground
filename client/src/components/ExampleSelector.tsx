import { useCallback, useState } from "react";
import { codeSamples } from "../codeSamples";
import { Select } from "@/components/retroui/Select";

type Props = {
  onExampleSelected: (code: string) => void;
};

export const ExampleSelector = ({ onExampleSelected }: Props) => {
  const [selectedName, setSelectedName] = useState<string | undefined>(undefined);

  const onValueChange = useCallback(
    (value: string) => {
      if (value === "none") {
        setSelectedName(undefined);
        return;
      }
      setSelectedName(value);
      const selectedExample = codeSamples.find((sample) => sample.name === value);
      if (selectedExample) {
        onExampleSelected(selectedExample.code);
      }
    },
    [onExampleSelected]
  );

  return (
    <div>
      <h2>Select Example</h2>
      <Select value={selectedName ?? ""} onValueChange={onValueChange}>
        <Select.Trigger>
          <Select.Value placeholder="-- Select an example --" />
        </Select.Trigger>
        <Select.Content>
          <Select.Item value="none">-- Select an example --</Select.Item>
          {codeSamples.map((sample) => (
            <Select.Item key={sample.name} value={sample.name}>
              {sample.name}
            </Select.Item>
          ))}
        </Select.Content>
      </Select>
    </div>
  );
};