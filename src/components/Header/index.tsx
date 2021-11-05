import { ReactElement } from 'react';
import Link from 'next/link';
import styles from './header.module.scss';

export default function Header(): ReactElement {
  return (
    <header className={styles.headerSpacing}>
      <Link href="/">
        <a>
          <img src="/images/logo.svg" alt="logo" />
        </a>
      </Link>
    </header>
  );
}
