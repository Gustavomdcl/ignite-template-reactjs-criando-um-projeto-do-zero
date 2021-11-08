import { ReactElement, useEffect } from 'react';
import { useRouter } from 'next/router';
import { GetStaticPaths, GetStaticProps } from 'next';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import Link from 'next/link';

import Prismic from '@prismicio/client';
import { RichText } from 'prismic-dom';
import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

const formatDate = (date: string): string => {
  return format(new Date(date), 'dd MMM yyyy', {
    locale: ptBR,
  });
};

const formatDateHour = (date: string): string => {
  return format(new Date(date), `HH:mm`, {
    locale: ptBR,
  });
};

interface Post {
  uid: string;
  first_publication_date: string | null;
  last_publication_date?: string | null;
  data: {
    title: string;
    subtitle: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostNeightbors {
  uid: string;
  data: {
    title: string;
  };
}

interface PostProps {
  post: Post;
  preview: boolean;
  prevpost: PostNeightbors | null;
  nextpost: PostNeightbors | null;
}

export default function Post({
  post,
  preview,
  prevpost,
  nextpost,
}: PostProps): ReactElement {
  const router = useRouter();

  useEffect(() => {
    const script = document.createElement('script');
    const anchor = document.getElementById('inject-comments-for-uterances');
    script.setAttribute('src', 'https://utteranc.es/client.js');
    script.setAttribute('crossorigin', 'anonymous');
    script.setAttribute('async', 'true');
    script.setAttribute('repo', 'Gustavomdcl/utterances_test');
    script.setAttribute('issue-term', post.uid);
    script.setAttribute('theme', 'photon-dark');
    anchor?.appendChild(script);
  }, [post]);

  if (router.isFallback) {
    return <div>Carregando...</div>;
  }
  return (
    <>
      <img className={styles.banner} src={post.data.banner.url} alt="" />
      <main className={commonStyles.container}>
        <div className={styles.post}>
          <div className={styles.postTop}>
            <h1>{post.data.title}</h1>
            <ul>
              <li>
                <FiCalendar size={20} />
                {formatDate(post.first_publication_date)}
              </li>
              <li>
                <FiUser size={20} />
                {post.data.author}
              </li>
              <li>
                <FiClock size={20} />
                {`${Math.ceil(
                  post.data.content
                    .reduce((total, content) => {
                      return `${total} ${content.heading} ${RichText.asText(
                        content.body
                      )}`;
                    }, '')
                    .split(/[ ]+/).length / 200
                )} min`}
              </li>
            </ul>
            {post.last_publication_date && (
              <p>
                <em>
                  * editado em {formatDate(post.last_publication_date)} às{' '}
                  {formatDateHour(post.last_publication_date)}
                </em>
              </p>
            )}
          </div>

          {post.data.content.map(content => (
            <article key={content.heading}>
              <h2>{content.heading}</h2>
              <div
                dangerouslySetInnerHTML={{
                  __html: RichText.asHtml(content.body),
                }}
              />
            </article>
          ))}

          {(prevpost || nextpost) && (
            <footer className={styles.footer}>
              {prevpost && (
                <Link href={`/post/${prevpost?.uid}`}>
                  <a className={styles.previous}>
                    <span>{prevpost?.data?.title}</span>
                    <span>Post anterior</span>
                  </a>
                </Link>
              )}
              {nextpost && (
                <Link href={`/post/${nextpost?.uid}`}>
                  <a className={styles.next}>
                    <span>{nextpost?.data?.title}</span>
                    <span>Próximo post</span>
                  </a>
                </Link>
              )}
            </footer>
          )}

          <div id="inject-comments-for-uterances" />

          {preview && (
            <aside>
              <Link href="/api/exit-preview">
                <a>Sair do modo Preview</a>
              </Link>
            </aside>
          )}
        </div>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const response = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['posts.slug'],
      pageSize: 100,
    }
  );

  const paths = response
    ? response.results.reduce((total, next) => {
        return [...total, { params: { slug: next.uid } }];
      }, [])
    : [];

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({
  params,
  preview = false,
  previewData,
}) => {
  const { slug } = params;
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug), {
    ref: previewData?.ref ?? null,
  });

  // Post não encontrado
  if (!response) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }

  const prevpost = (
    await prismic.query([Prismic.predicates.at('document.type', 'posts')], {
      fetch: ['posts.title'],
      after: `${response.id}`,
      orderings: '[document.first_publication_date desc]',
      pageSize: 1,
      ref: previewData?.ref ?? null,
    })
  ).results[0];

  const nextpost = (
    await prismic.query([Prismic.predicates.at('document.type', 'posts')], {
      fetch: ['posts.title'],
      after: `${response.id}`,
      orderings: '[document.first_publication_date]',
      pageSize: 1,
      ref: previewData?.ref ?? null,
    })
  ).results[0];

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    last_publication_date: response.last_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      banner: response.data.banner,
      author: response.data.author,
      content: response.data.content,
    },
  };

  // TODO
  return {
    props: {
      post,
      preview,
      prevpost: prevpost !== undefined ? prevpost : null,
      nextpost: nextpost !== undefined ? nextpost : null,
    },
    redirect: 60 * 30, // 30 minutes
  };
};
