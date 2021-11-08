/* eslint-disable consistent-return */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { NextApiRequest, NextApiResponse } from 'next';
import { getPrismicClient, linkResolver } from '../../services/prismic';

export default async (request: NextApiRequest, response: NextApiResponse) => {
  const { token: ref, documentId } = request.query;
  const redirectUrl = await getPrismicClient(request)
    .getPreviewResolver(ref.toString(), documentId.toString())
    .resolve(linkResolver, '/');

  if (!redirectUrl) {
    return response.status(401).json({ message: 'Invalid token' });
  }

  response.setPreviewData({ ref });

  response.write(
    `<!DOCTYPE html><html><head><meta http-equiv="Refresh" content="0; url=${redirectUrl}" />
    <script>window.location.href = '${redirectUrl}'</script>
    </head>`
  );
  response.end();
};
