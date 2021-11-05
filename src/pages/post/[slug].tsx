import { ReactElement } from 'react';
import { useRouter } from 'next/router';
import { GetStaticPaths, GetStaticProps } from 'next';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

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

interface Post {
  uid: string;
  first_publication_date: string | null;
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

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): ReactElement {
  const router = useRouter();
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

export const getStaticProps: GetStaticProps = async context => {
  const { slug } = context.params;
  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug), {});

  // Post não encontrado
  if (!response) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
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
    },
    redirect: 60 * 30, // 30 minutes
  };
};
