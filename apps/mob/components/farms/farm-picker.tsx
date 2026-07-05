import { useState } from "react";
import { View, FlatList, TouchableOpacity } from "react-native";
import { Text } from "@/components/ui/text";
import { Input } from "@/components/ui/input";
import { trpc } from "@/providers/trpc-provider";

interface FarmSummary {
  id: string;
  name: string | null;
}

interface FarmPickerProps {
  onSelect: (farm: FarmSummary) => void;
  placeholder?: string;
}

export function FarmPicker({ onSelect, placeholder = "Search farm..." }: FarmPickerProps) {
  const [query, setQuery] = useState("");
  const { data } = trpc.farm.list.useQuery({ search: query, limit: 10, offset: 0 });

  return (
    <View className="gap-2">
      <Input placeholder={placeholder} value={query} onChangeText={setQuery} />
      {query.length > 0 && data && data.data.length > 0 && (
        <View className="border border-border rounded-md max-h-48">
          <FlatList
            data={data.data}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => { onSelect({ id: item.id, name: item.name }); setQuery(""); }}
                className="px-3 py-2 border-b border-border"
              >
                <Text className="text-foreground font-medium">{item.name ?? "Unnamed Farm"}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </View>
  );
}
