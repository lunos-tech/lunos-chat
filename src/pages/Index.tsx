import PlaygroundLayout from "@/components/playground/PlaygroundLayout";
import SeoHead from "@/components/SeoHead";

export default function Index() {
  return (
    <>
      <SeoHead
        title="Lunos Playground | AI Chat Playground for Developers"
        description="Use Lunos Playground to run AI chats, test prompt strategies, tune model parameters, and compare output quality in one place."
        path="/"
      />
      <PlaygroundLayout />
    </>
  );
}
