const prod = process.env.NODE_ENV === "production"

// Actual values. If dev, these may change below.
const castingComplete = false

// All of this "site" data should eventually be moved to a better place for
// Sapper. For now, for backward compatibility, it is all just here.
export default {
  baseurl: "",
  url: prod ? "https://postplayhouse.com" : "",
  maintainerEmail: "don@postplayhouse.com",
  icon: "/images/post-playhouse-logo.png",
  title: "Post Playhouse",
  twitter: "postplayhouse",
  facebook: "post.playhouse",
  castingComplete: prod ? castingComplete : true,
  season: 2020,
  description:
    "Post Playhouse, Inc. is Northwestern Nebraska's favorite live theatre company, producing several musicals running in a repertory schedule every summer by bringing together highly skilled creative professionals from across the country and nearby. Post Playhouse, Inc. performs its productions at the theatre in Fort Robinson State Park.",
  boxOfficePhone: "1-888-665-1976",
  ticketsLink: "https://postplayhousetickets.universitytickets.com/",
}
