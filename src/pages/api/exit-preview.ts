/* eslint-disable consistent-return */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { NextApiRequest, NextApiResponse } from 'next';
import url from 'url';

export default async (request: NextApiRequest, response: NextApiResponse) => {
  // Exit the current user from "Preview Mode". This function accepts no args.
  response.clearPreviewData();

  const queryObject = url.parse(request.url, true).query;
  const redirectUrl =
    queryObject && queryObject.currentUrl ? queryObject.currentUrl : '/';

  response.writeHead(307, { Location: redirectUrl });
  response.end();
};
