import { Container, Main, Prose } from "#components/layout";

export default function DashboardPage() {
  return (
    <Main>
      <Container>
        <Prose isArticle>
          <h1>Dashboard</h1>
          <p>Welcome to the AIMCS Admin panel.</p>
        </Prose>
      </Container>
    </Main>
  );
}
