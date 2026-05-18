import Link from "next/link";
import type { JSX } from "react";

const Home = (): JSX.Element => {
  return (
    <div>
      <h2>Home</h2>
      <button>
        <Link href="/login">Go to Dashboard</Link>
      </button>
    </div>
  );
};

export default Home;
