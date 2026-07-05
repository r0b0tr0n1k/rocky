import { useState } from "react";
import { View, FlatList, TouchableOpacity } from "react-native";
import { Text } from "@/components/ui/text";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/providers/trpc-provider";

type AnimalSummary = {
  id: string;
  stateCode: string;
  earTagNumber: string;
  sex: string;
  breed: string | null;
  status: string;
};

interface AnimalPickerProps {
  onSelect: (animal: AnimalSummary) => void;
  placeholder?: string;
}

export function AnimalPicker({ onSelect, placeholder = "Search by ear tag..." }: AnimalPickerProps) {
  const [query, setQuery] = useState("");
  const { data } = trpc.animal.list.useQuery({ search: query, limit: 10, offset: 0 });

  const results = data?.data ?? [];

  return (
    <View className="gap-2">
      <Input
        placeholder={placeholder}
        value={query}
        onChangeText={setQuery}
        autoCapitalize="characters"
      />
      {query.length > 0 && results.length > 0 && (
        <View className="border border-border rounded-md max-h-48">
          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => { onSelect(item); setQuery(""); }}
                className="flex-row items-center justify-between px-3 py-2 border-b border-border"
              >
                <View>
                  <Text className="text-foreground font-medium">{item.stateCode} {item.earTagNumber}</Text>
                  <Text className="text-muted-foreground text-xs">{item.sex} — {item.breed ?? "N/A"}</Text>
                </View>
                <Badge variant={item.status === "alive" ? "default" : "secondary"}>
                  <Text className="text-xs">{item.status}</Text>
                </Badge>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </View>
  );
}
