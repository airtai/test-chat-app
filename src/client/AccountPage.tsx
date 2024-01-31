import { User } from "@wasp/entities";
import { useQuery } from "@wasp/queries";
// import getRelatedObjects from '@wasp/queries/getRelatedObjects'
import logout from "@wasp/auth/logout";
import stripePayment from "@wasp/actions/stripePayment";
import { useState, Dispatch, SetStateAction } from "react";
import { Link } from "@wasp/router";

// get your own link from your stripe dashboard: https://dashboard.stripe.com/settings/billing/portal
// @ts-ignore
const CUSTOMER_PORTAL_LINK = import.meta.env.REACT_APP_CUSTOMER_PORTAL_LINK;

export default function Example({ user }: { user: User }) {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // const { data: relatedObjects, isLoading: isLoadingRelatedObjects } = useQuery(getRelatedObjects)

  return (
    <div className="mt-10 px-6 mx-auto w-auto md:w-1/2">
      <div className="overflow-hidden bg-white ring-1 ring-gray-900/10 shadow-lg sm:rounded-lg m-8 ">
        <div className="px-4 py-5 sm:px-6 lg:px-8">
          <h3 className="text-base font-semibold leading-6 text-gray-900">
            Account Information
          </h3>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
          <dl className="sm:divide-y sm:divide-gray-200">
            <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-5 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">
                Email address
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                {user.email}
              </dd>
            </div>
            <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-5 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">
                Subscription status
              </dt>
              {user.hasPaid ? (
                <>
                  {user.subscriptionStatus !== "past_due" ? (
                    <dd className="mt-1 text-sm text-gray-900 sm:col-span-1 sm:mt-0">
                      Monthly Subscription
                      <span className="text-xs leading-7 text-gray-600">
                        {user.subscriptionStatus === "canceled"
                          ? " (Cancelled, will be switched to the Basic plan at the end of the billing period.)"
                          : ""}
                      </span>
                    </dd>
                  ) : (
                    <dd className="mt-1 text-sm text-gray-900 sm:col-span-1 sm:mt-0">
                      Your Account is Past Due! Please Update your Payment
                      Information
                    </dd>
                  )}

                  <CustomerPortalButton
                    isLoading={isLoading}
                    setIsLoading={setIsLoading}
                  />
                </>
              ) : (
                <>
                  <dd className="mt-1 text-sm text-gray-900 sm:col-span-1 sm:mt-0">
                    {/* Credits remaining: {user.credits} */}
                    N/A
                  </dd>
                  <BuyMoreButton
                    isLoading={isLoading}
                    setIsLoading={setIsLoading}
                  />
                </>
              )}
            </div>
            {/* <div className="py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-5 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">About</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
                I'm a cool customer.
              </dd>
            </div> */}
            {/* <div className='py-4 sm:grid sm:grid-cols-3 sm:gap-4 sm:py-5 sm:px-6'> */}
            {/* <dt className='text-sm font-medium text-gray-500'>Most Recent User RelatedObject</dt> */}
            {/* <dd className='mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0'>
                {!!relatedObjects && relatedObjects.length > 0
                  ? relatedObjects[relatedObjects.length - 1].content
                  : "You don't have any at this time."}
              </dd> */}
            {/* </div> */}
          </dl>
        </div>
      </div>
      <div className="inline-flex w-full justify-end">
        <button
          onClick={logout}
          className="inline-flex justify-center mx-8 py-2 px-4 border border-transparent shadow-md text-sm font-medium rounded-md text-white bg-captn-cta-red hover:bg-captn-cta-red-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          logout
        </button>
      </div>
    </div>
  );
}

function BuyMoreButton({
  isLoading,
  setIsLoading,
}: {
  isLoading: boolean;
  setIsLoading: Dispatch<SetStateAction<boolean>>;
}) {
  const handleClick = async () => {
    try {
      setIsLoading(true);
      const stripeResults = await stripePayment();
      if (stripeResults?.sessionUrl) {
        window.open(stripeResults.sessionUrl, "_self");
      }
    } catch (error: any) {
      alert(error?.message ?? "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="ml-4 flex-shrink-0 sm:col-span-1 sm:mt-0">
      {/* <p className="font-medium text-sm text-indigo-600 hover:text-indigo-500">
        {!isLoading ? <Link to="/pricing">Upgrade</Link> : "Loading..."}
      </p> */}
      <button
        onClick={handleClick}
        className={`font-medium text-sm text-indigo-600 hover:text-indigo-500 ${
          isLoading && "animate-pulse"
        }`}
      >
        {!isLoading ? "Upgrade to free trial" : "Loading..."}
      </button>
    </div>
  );
}

function CustomerPortalButton({
  isLoading,
  setIsLoading,
}: {
  isLoading: boolean;
  setIsLoading: Dispatch<SetStateAction<boolean>>;
}) {
  const handleClick = () => {
    setIsLoading(true);
    window.open(CUSTOMER_PORTAL_LINK, "_blank");
    setIsLoading(false);
  };

  return (
    <div className="ml-4 flex-shrink-0 sm:col-span-1 sm:mt-0">
      <button
        onClick={handleClick}
        className={`font-medium text-sm text-indigo-600 hover:text-indigo-500 ${
          isLoading && "animate-pulse"
        }`}
      >
        {!isLoading ? "Manage Subscription" : "Loading..."}
      </button>
    </div>
  );
}
