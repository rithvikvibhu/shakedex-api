const {ValidationError, NotFoundError} = require('../service/errors.js');
const {container} = require('../container.js');
const viewHelpers = require('../viewHelpers.js');
const {Auction} = require('shakedex/src/auction.js');

module.exports = {
  'GET /': async (req, res) => {
    const auctionService = await container.resolve('AuctionService');
    const {auctions, total} = await auctionService.getAuctions(1, 25);

    res.render('auctions/index', {
      title: 'Auctions',
      auctions,
      total,
      totalPages: Math.ceil(total / 25),
      currentPage: 1,
      viewHelpers,
    });
  },
  'GET /auctions/:auction_id': async (req, res) => {
    const auctionService = await container.resolve('AuctionService');
    const auction = await auctionService.getAuction(req.params.auction_id);
    res.render('auctions/show', {
      title: `Auction &raquo; ${auction.name}`,
      auction,
      viewHelpers,
    });
  },
  'POST /api/:v/auctions': async (req, res) => {
    if (req.params.v === 'v1') {
      throw new ValidationError('Update your software, Shakedex V2 is a breaking change.');
    }

    if (!req.body) {
      throw new ValidationError('Must define a request body.');
    }

    const auctionService = await container.resolve('AuctionService');
    const auction = await auctionService.createAuction(
      req.body.auction,
    );
    res.status(200);
    res.json(auction);
  },
  'GET /api/:v/auctions': async (req, res) => {
    if (req.params.v === 'v1') {
      res.json({
        auctions: [],
        total: 0,
      });
      return;
    }
    const {page, per_page: perPage, search, sort_field: sortField, sort_direction: sortDirection} = req.query;
    let filters = req.query.filters;
    if (filters) {
      try {
        filters = JSON.parse(filters);
      } catch (e) {
        throw new ValidationError('Filters must be a URL-encoded JSON.');
      }
    }
    const auctionService = await container.resolve('AuctionService');
    const {auctions, total} = await auctionService.getAuctions(page, perPage, search, filters, sortField, sortDirection);
    res.status(200);
    res.json({
      auctions,
      total,
    });
  },
  'GET /api/:v/auctions/:auction_id': async (req, res) => {
    if (req.params.v === 'v1') {
      throw new NotFoundError(`Auction not found. Update to api v2.`);
    }
    const auctionService = await container.resolve('AuctionService');
    const auction = await auctionService.getAuction(req.params.auction_id);
    res.status(200);
    res.json({
      auction,
    });
  },
  'GET /api/:v/auctions/n/:name': async (req, res) => {
    if (req.params.v === 'v1') {
      throw new NotFoundError(`Auction not found. Update to api v2.`);
    }
    const auctionService = await container.resolve('AuctionService');
    const auction = await auctionService.getAuctionByName(req.params.name);
    res.status(200);
    res.json({
      auction,
    });
  },
  'GET /api/:v/auctions/:auction_id/download': async (req, res) => {
    if (req.params.v === 'v1') {
      throw new NotFoundError(`Auction not found. Update to api v2.`);
    }
    const auctionService = await container.resolve('AuctionService');
    const auction = await auctionService.getAuction(req.params.auction_id);
    await streamAuctionRes(auction, res);
  },
  'GET /api/:v/auctions/n/:name/download': async (req, res) => {
    if (req.params.v === 'v1') {
      throw new NotFoundError(`Auction not found. Update to api v2.`);
    }
    const auctionService = await container.resolve('AuctionService');
    const auction = await auctionService.getAuctionByName(req.params.name);
    await streamAuctionRes(auction, res)
  },
};

async function streamAuctionRes(auctionJSON, res) {
  res.status(200);
  res.append('Content-Disposition', `attachment; filename=auction-${auctionJSON.name}-${auctionJSON.id}.json`);
  res.append('Content-Type', 'text/plain');

  const context = await container.resolve('SDContext');

  auctionJSON.data = auctionJSON.bids;
  const auction = new Auction(auctionJSON);
  const data = auction.toJSON(context);

  await res.write(JSON.stringify(data));
  res.end();
}
