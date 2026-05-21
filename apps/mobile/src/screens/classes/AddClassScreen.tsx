import { useNavigation } from "@react-navigation/native";
import { ClassForm } from "../../components/forms/ClassForm";
import { AppScreen } from "../../components/ui/AppScreen";
import { useClasses } from "../../hooks/useClasses";
import type { ClassInput } from "../../types/class.types";

export function AddClassScreen() {
  const navigation = useNavigation();
  const { createClass, isSaving } = useClasses();

  async function handleSubmit(values: ClassInput) {
    await createClass(values);
    navigation.goBack();
  }

  return (
    <AppScreen title="Add class" subtitle="Mark mandatory sessions clearly so the dashboard can help you prioritize.">
      <ClassForm onSubmit={handleSubmit} loading={isSaving} />
    </AppScreen>
  );
}

