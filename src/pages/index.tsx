import { ReactElement, useState, useCallback } from 'react';
import { GetStaticProps } from 'next';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { FiCalendar, FiUser } from 'react-icons/fi';

import Prismic from '@prismicio/client';
import Link from 'next/link';
import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

const formatDate = (date: string): string => {
  return format(new Date(date), 'dd MMM yyyy', {
    locale: ptBR,
  });
};

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
  preview: boolean;
}

export default function Home({
  postsPagination: { results, next_page },
  preview,
}: HomeProps): ReactElement {
  const [posts, setPosts] = useState<Post[]>(() => {
    return results.map(post => {
      return {
        uid: post.uid,
        first_publication_date: formatDate(post.first_publication_date),
        data: {
          title: post.data.title,
          subtitle: post.data.subtitle,
          author: post.data.author,
        },
      };
    });
  });
  const [nextPage, setNextPage] = useState<null | string>(next_page);
  const handlePagination = useCallback(() => {
    fetch(nextPage)
      .then(response => {
        return response.json();
      })
      .then(data => {
        const newPosts = data.results.map(post => {
          return {
            uid: post.uid,
            first_publication_date: formatDate(post.first_publication_date),
            data: {
              title: post.data.title,
              subtitle: post.data.subtitle,
              author: post.data.author,
            },
          };
        });
        setPosts(currentPosts => [...currentPosts, ...newPosts]);
        setNextPage(data.next_page);
      });
  }, [nextPage]);
  return (
    <div className={commonStyles.container}>
      {posts.map(post => (
        <article key={post.uid}>
          <Link href={`/post/${post.uid}`}>
            <a className={styles.post}>
              <strong>{post.data.title}</strong>
              <p>{post.data.subtitle}</p>
              <div className={styles.containerSmall}>
                <time>
                  <FiCalendar size={20} />
                  {post.first_publication_date}
                </time>
                <small>
                  <FiUser size={20} />
                  {post.data.author}
                </small>
              </div>
            </a>
          </Link>
        </article>
      ))}
      {nextPage && (
        <button
          className={styles.button}
          type="button"
          onClick={handlePagination}
        >
          Carregar mais posts
        </button>
      )}
      {preview && (
        <aside>
          <Link href="/api/exit-preview">
            <a>Sair do modo Preview</a>
          </Link>
        </aside>
      )}
    </div>
  );
}

export const getStaticProps: GetStaticProps = async ({
  preview = false,
  previewData,
}) => {
  const prismic = getPrismicClient();
  const { results: posts, next_page } = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['posts.title', 'posts.subtitle', 'posts.author'],
      pageSize: 1,
      ref: previewData?.ref ?? null,
    }
  );

  const results = posts.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });

  return {
    props: {
      postsPagination: {
        results,
        next_page,
      },
      preview,
    },
  };
};
