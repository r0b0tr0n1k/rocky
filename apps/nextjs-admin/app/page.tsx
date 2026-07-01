import { Container, Main, Prose } from "@prasici/ui/components";

export default function Home() {
  return (
    <Main>
      <Container>
        <Prose isArticle>
          <h1>AIMCS Admin</h1>
          <p>
            Animal Identification & Movement Control System — admin panel.
          </p>
        </Prose>
      </Container>
    </Main>
  );
}
