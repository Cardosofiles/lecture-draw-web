import type { JSX } from "react";

import { redirect } from "next/navigation";

const Home = (): JSX.Element => {
  return redirect("/login");
};

export default Home;
