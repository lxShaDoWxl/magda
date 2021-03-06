import React, { Component } from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import { Link } from "react-router-dom";
import ErrorHandler from "../../Components/ErrorHandler";
import { config } from "../../config";
import ReactDocumentTitle from "react-document-title";
import {
    fetchPublisherIfNeeded,
    resetFetchPublisher
} from "../../actions/publisherActions";
import OverviewBox from "../../UI/OverviewBox";
import ProgressBar from "../../UI/ProgressBar";
import Breadcrumbs from "../../UI/Breadcrumbs";
import { Medium } from "../../UI/Responsive";
import AUpageAlert from "../../pancake/react/page-alerts";
import {
    fetchSearchResultsIfNeeded,
    resetDatasetSearch
} from "../../actions/datasetSearchActions";
import "./PublisherDetails.css";

class PublisherDetails extends Component {
    componentDidMount() {
        this.props.fetchPublisherIfNeeded(this.props.match.params.publisherId);
    }

    componentDidUpdate(prevProps) {
        if (
            prevProps.match.params.publisherId !==
            this.props.match.params.publisherId
        ) {
            this.props.fetchPublisherIfNeeded(
                this.props.match.params.publisherId
            );
        } else if (
            this.props.publisher.name &&
            this.props.publisher.name !== this.props.searchPublisherName
        ) {
            this.props.resetDatasetSearch();
            this.props.fetchSearchResultsIfNeeded({
                publisher: this.props.publisher.name
            });
        }
    }

    componentWillUnmount() {
        this.props.resetFetchPublisher();
    }

    renderContent() {
        const publisher = this.props.publisher;
        const details = publisher.aspects["organization-details"];
        const description =
            details.description && details.description.length > 0
                ? details.description
                : "This publisher has no description";

        const breadcrumbs = [
            <li key="organisations">
                <Link to="/organisations">Organisations</Link>
            </li>,
            <li key={publisher.name}>
                <span>{publisher.name}</span>
            </li>
        ];

        const hitCount = this.props.hitCount ? this.props.hitCount + " " : "";

        return (
            <ReactDocumentTitle
                title={`${publisher.name} | Organisations | ${config.appName}`}
            >
                <div className="publisher-details">
                    <div>
                        <Medium>
                            <Breadcrumbs breadcrumbs={breadcrumbs} />
                        </Medium>
                        <div className="publisher-details__body">
                            <div className="media">
                                <div className="media-body">
                                    <h1>{publisher.name}</h1>
                                </div>
                            </div>

                            <div className="publisher-details-overview">
                                <OverviewBox content={description} />
                            </div>

                            {(details.email ||
                                details.website ||
                                details.phone) && (
                                <div className="publisher-details-contacts">
                                    <h3 className="section-heading">
                                        Contact details
                                    </h3>
                                    {details.email && (
                                        <div className="publisher-details-contacts-item">
                                            Email:&nbsp;
                                            <a
                                                href={emailLink(details.email)}
                                                className="url"
                                            >
                                                {details.email}
                                            </a>
                                        </div>
                                    )}
                                    {details.website && (
                                        <div className="publisher-details-contacts-item">
                                            Website:{" "}
                                            <a
                                                href={details.website}
                                                className="url"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                {details.website}
                                            </a>
                                        </div>
                                    )}
                                    {details.phone && (
                                        <div className="publisher-details-contacts-item">
                                            Phone: {details.phone}
                                        </div>
                                    )}
                                </div>
                            )}

                            <br />
                            <div>
                                <Link
                                    className="au-cta-link"
                                    to={{
                                        pathname: "/search",
                                        search: `?organisation=${encodeURIComponent(
                                            publisher.name
                                        )}`,
                                        state: {
                                            showFilterExplanation: true
                                        }
                                    }}
                                >
                                    View all {hitCount}
                                    datasets from {publisher.name}
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </ReactDocumentTitle>
        );
    }

    render() {
        if (this.props.error) {
            return <ErrorHandler error={this.props.error} />;
        } else if (this.props.isFetching) {
            return <ProgressBar />;
        } else if (
            decodeURIComponent(this.props.match.params.publisherId) ===
            this.props.publisher.id
        ) {
            return (
                <ReactDocumentTitle
                    title={this.props.publisher.name + " | " + config.appName}
                >
                    {this.renderContent()}
                </ReactDocumentTitle>
            );
        } else {
            return (
                <AUpageAlert as="info" className="notification__inner">
                    Organisation cannot be found
                </AUpageAlert>
            );
        }
    }
}

function mapDispatchToProps(dispatch) {
    return bindActionCreators(
        {
            fetchPublisherIfNeeded: fetchPublisherIfNeeded,
            resetFetchPublisher: resetFetchPublisher,
            fetchSearchResultsIfNeeded: fetchSearchResultsIfNeeded,
            resetDatasetSearch: resetDatasetSearch
        },
        dispatch
    );
}

function mapStateToProps(state: Object, ownProps: Object) {
    const publisher: Object = state.publisher.publisher;
    const isFetching: boolean = state.publisher.isFetchingPublisher;
    const error: object = state.publisher.errorFetchingPublisher;
    const location: Location = ownProps.location;
    const datasetSearch: Object = state.datasetSearch;
    const searchPublisherName =
        datasetSearch.queryObject && datasetSearch.queryObject.publisher;
    const hitCount = datasetSearch.hitCount;
    return {
        publisher,
        isFetching,
        location,
        searchPublisherName,
        hitCount,
        error
    };
}

function emailLink(address: string) {
    if (address.match(/^[a-z]+:/)) {
        return address;
    } else {
        return "mailto:" + address;
    }
}

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(PublisherDetails);
